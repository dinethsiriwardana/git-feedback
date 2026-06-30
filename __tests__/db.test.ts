import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env files (same way Next.js does)
loadEnvConfig(process.cwd());

const testDbDir = path.join(process.cwd(), 'data-test');

describe('Database CRUD operations', () => {
  let dbModule: any;

  beforeAll(async () => {
    // Set environment variables BEFORE importing the DB module
    process.env.DB_DIR = testDbDir;
    process.env.DB_PATH = path.join(testDbDir, 'feedback-test.db');
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is missing.');
    }

    // Clean up database BEFORE importing the module to ensure it's empty
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }

    // Dynamically import to ensure environment variables and file cleanups happen first
    dbModule = await import('../lib/db');
  });

  it('should start with an empty feedbacks list', () => {
    const feedbacks = dbModule.getAllFeedbacks();
    expect(feedbacks).toEqual([]);
  });

  it('should successfully create feedback and retrieve it decrypted', async () => {
    const id = 'test-fb-1';
    const name = 'John Doe';
    const message = 'Excellent app!';
    const imagePath = '/api/feedback/image/test-img.enc';

    const created = await dbModule.createFeedback(id, name, message, imagePath);

    expect(created.id).toBe(id);
    expect(created.name).toBe(name);
    expect(created.message).toBe(message);
    expect(created.image_path).toBe(imagePath);
    expect(created.likes).toBe(0);

    const all = dbModule.getAllFeedbacks();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(id);
    expect(all[0].name).toBe(name);
    expect(all[0].message).toBe(message);
  });

  it('should toggle likes correctly', async () => {
    const id = 'test-fb-1';
    const visitor1 = 'visitor-1';
    const visitor2 = 'visitor-2';

    // 1. visitor1 likes it
    const res1 = await dbModule.toggleLike(id, visitor1);
    expect(res1.likes).toBe(1);
    expect(res1.hasLiked).toBe(true);

    // 2. check getAllFeedbacks with visitor1
    const listForV1 = dbModule.getAllFeedbacks(visitor1);
    expect(listForV1[0].likes).toBe(1);
    expect(listForV1[0].hasLiked).toBe(true);

    // 3. check getAllFeedbacks with visitor2 (should not have liked)
    const listForV2 = dbModule.getAllFeedbacks(visitor2);
    expect(listForV2[0].likes).toBe(1);
    expect(listForV2[0].hasLiked).toBe(false);

    // 4. visitor1 un-likes it
    const res2 = await dbModule.toggleLike(id, visitor1);
    expect(res2.likes).toBe(0);
    expect(res2.hasLiked).toBe(false);
  });
});
