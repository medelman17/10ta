import { NextResponse } from 'next/server';
import { analyzeIssuePhoto } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new NextResponse('Image URL required', { status: 400 });
    }

    const analysis = await analyzeIssuePhoto(imageUrl);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Photo analysis error:', error);
    return new NextResponse('Analysis failed', { status: 500 });
  }
}