import { NextResponse } from 'next/server';
import { analyzeIssuePhoto } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  console.log('=== Analyze Photo API Route Called ===');
  try {
    const user = await getCurrentUser();
    console.log('User found:', user ? `${user.id} (${user.email})` : 'null');
    
    if (!user) {
      console.log('No user found, returning 401');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);
    const { imageUrl } = body;
    
    if (!imageUrl) {
      console.log('No imageUrl provided, returning 400');
      return new NextResponse('Image URL required', { status: 400 });
    }

    console.log('Starting AI analysis for image:', imageUrl);
    const analysis = await analyzeIssuePhoto(imageUrl);
    console.log('AI analysis completed:', analysis);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Photo analysis error:', error);
    return new NextResponse(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}