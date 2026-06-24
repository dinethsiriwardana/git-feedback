import { NextRequest, NextResponse } from 'next/server';
import { getAllFeedbacks, createFeedback } from '@/lib/db';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const visitorId = searchParams.get('visitorId') || undefined;
    const feedbacks = getAllFeedbacks(visitorId);
    return NextResponse.json({ feedbacks });
  } catch (error: any) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const message = formData.get('message') as string;
    const imageFile = formData.get('image') as File | null;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message cannot exceed 500 characters' }, { status: 400 });
    }

    let imagePath: string | null = null;

    if (imageFile && imageFile.size > 0) {
      // 1. Enforce max file size check (5MB raw max limit)
      const MAX_RAW_SIZE = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > MAX_RAW_SIZE) {
        return NextResponse.json({ error: 'Image size exceeds maximum 5MB selection limit' }, { status: 400 });
      }

      // Convert File to Buffer for sharp
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate unique name
      const filename = `${uuidv4()}.webp`;
      const fullPath = path.join(UPLOAD_DIR, filename);

      // 2. Perform Server-side compression to <= 1MB using sharp.
      // We'll resize to sensible web dimensions (e.g. max width 1200px) and export as WebP with optimized quality.
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // Ensure the compressed file is indeed under 1MB; if not, lower the quality recursively
      let finalBuffer = compressedBuffer;
      let quality = 70;
      while (finalBuffer.length > 1024 * 1024 && quality >= 20) {
        finalBuffer = await sharp(buffer)
          .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
        quality -= 15;
      }

      // Write compressed image
      fs.writeFileSync(fullPath, finalBuffer);
      imagePath = `/uploads/${filename}`;
    }

    const newFeedback = await createFeedback(
      uuidv4(),
      name,
      message,
      imagePath
    );

    return NextResponse.json({ feedback: newFeedback });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}
