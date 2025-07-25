import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  console.log('=== Upload API Route Called ===');
  try {
    const user = await getCurrentUser();
    console.log('User found:', user ? `${user.id} (${user.email})` : 'null');
    
    if (!user) {
      console.log('No user found, returning 401');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    console.log('File received:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'null');
    
    if (!file) {
      console.log('No file provided, returning 400');
      return new NextResponse('No file provided', { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large, returning 400');
      return new NextResponse('File size must be less than 10MB', { status: 400 });
    }
    
    // Validate file type (images only for now)
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type, returning 400');
      return new NextResponse('Only image files are allowed', { status: 400 });
    }
    
    console.log('Uploading to Vercel Blob...');
    // Upload to Vercel Blob
    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    console.log('Upload successful:', blob.url);
    
    const response = {
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
    console.log('Returning response:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}