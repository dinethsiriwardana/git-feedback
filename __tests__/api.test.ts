import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { loadEnvConfig } from '@next/env';
import { NextRequest, NextResponse } from 'next/server';

// Load environment variables
loadEnvConfig(process.cwd());

const testDbDir = path.join(process.cwd(), 'data-test-api');

describe('API Routes Integration Tests', () => {
  let apiRoute: any;
  let likeRoute: any;
  let imageRoute: any;
  const createdFiles: string[] = [];

  beforeAll(async () => {
    // Redirect database directory and path to testing versions
    process.env.DB_DIR = testDbDir;
    process.env.DB_PATH = path.join(testDbDir, 'feedback-api-test.db');

    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }

    // Clean up test database directory
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }

    // Dynamically import the API routes so they load using our test database environment variables
    apiRoute = await import('../app/api/feedback/route');
    likeRoute = await import('../app/api/feedback/[id]/like/route');
    imageRoute = await import('../app/api/feedback/image/[filename]/route');
  });

  afterAll(() => {
    // Clean up test database directory
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }

    // Clean up any encrypted image files written to public/uploads
    for (const filename of createdFiles) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    }
  });

  describe('GET /api/feedback', () => {
    it('should return an empty list initially', async () => {
      const req = new NextRequest('http://localhost/api/feedback');
      const response = await apiRoute.GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('feedbacks');
      expect(data.feedbacks).toEqual([]);
    });
  });

  describe('POST /api/feedback', () => {
    it('should return 400 error when message is empty', async () => {
      const formData = new FormData();
      formData.append('message', '');

      const req = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const response = await apiRoute.POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Message is required');
    });

    it('should return 400 error when message exceeds 500 characters', async () => {
      const formData = new FormData();
      formData.append('message', 'a'.repeat(501));

      const req = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const response = await apiRoute.POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Message cannot exceed 500 characters');
    });

    it('should successfully create anonymous feedback without image', async () => {
      const formData = new FormData();
      formData.append('message', 'This is a test message!');

      const req = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const response = await apiRoute.POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('feedback');
      expect(data.feedback.name).toBe('Anonymous');
      expect(data.feedback.message).toBe('This is a test message!');
      expect(data.feedback.image_path).toBeNull();
    });

    it('should successfully create feedback with a compressed and encrypted image', async () => {
      const formData = new FormData();
      formData.append('name', 'Alice');
      formData.append('message', 'Feedback with image');

      // 1x1 transparent PNG
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const imageBuffer = Buffer.from(pngBase64, 'base64');
      const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
      formData.append('image', file);

      const req = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const response = await apiRoute.POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.feedback.name).toBe('Alice');
      expect(data.feedback.image_path).not.toBeNull();
      expect(data.feedback.image_path).toContain('/api/feedback/image/');

      // Track created file for cleanup
      const filename = path.basename(data.feedback.image_path);
      createdFiles.push(filename);
    });
  });

  describe('GET /api/feedback/image/[filename]', () => {
    it('should return 404 for non-existent image', async () => {
      const req = new NextRequest('http://localhost/api/feedback/image/nonexistent.enc');
      const response = await imageRoute.GET(req, {
        params: Promise.resolve({ filename: 'nonexistent.enc' }),
      });
      expect(response.status).toBe(404);
    });

    it('should return 200 and decrypt the uploaded image correctly', async () => {
      // First let's fetch the feedbacks to get the image path from the previous test
      const reqList = new NextRequest('http://localhost/api/feedback');
      const resList = await apiRoute.GET(reqList);
      const dataList = await resList.json();
      const feedbackWithImage = dataList.feedbacks.find((f: any) => f.image_path !== null);

      expect(feedbackWithImage).toBeDefined();
      const imagePath = feedbackWithImage.image_path;
      const filename = path.basename(imagePath);

      const reqImg = new NextRequest(`http://localhost${imagePath}`);
      const response = await imageRoute.GET(reqImg, {
        params: Promise.resolve({ filename }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/webp');
      
      const arrayBuffer = await response.arrayBuffer();
      expect(arrayBuffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('POST /api/feedback/[id]/like', () => {
    it('should fail if visitorId is missing', async () => {
      const req = new NextRequest('http://localhost/api/feedback/test-id/like', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await likeRoute.POST(req, {
        params: Promise.resolve({ id: 'test-id' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('visitorId is required');
    });

    it('should toggle likes correctly for a valid feedback', async () => {
      // Fetch current feedbacks to get a valid ID
      const reqList = new NextRequest('http://localhost/api/feedback');
      const resList = await apiRoute.GET(reqList);
      const dataList = await resList.json();
      const feedbackId = dataList.feedbacks[0].id;

      const visitorId = 'visitor-123';

      // 1. Like the feedback
      const reqLike = new NextRequest(`http://localhost/api/feedback/${feedbackId}/like`, {
        method: 'POST',
        body: JSON.stringify({ visitorId }),
      });
      const resLike = await likeRoute.POST(reqLike, {
        params: Promise.resolve({ id: feedbackId }),
      });
      expect(resLike.status).toBe(200);
      const dataLike = await resLike.json();
      expect(dataLike.likes).toBe(1);
      expect(dataLike.hasLiked).toBe(true);

      // 2. Unlike the feedback
      const reqUnlike = new NextRequest(`http://localhost/api/feedback/${feedbackId}/like`, {
        method: 'POST',
        body: JSON.stringify({ visitorId }),
      });
      const resUnlike = await likeRoute.POST(reqUnlike, {
        params: Promise.resolve({ id: feedbackId }),
      });
      expect(resUnlike.status).toBe(200);
      const dataUnlike = await resUnlike.json();
      expect(dataUnlike.likes).toBe(0);
      expect(dataUnlike.hasLiked).toBe(false);
    });
  });
});
