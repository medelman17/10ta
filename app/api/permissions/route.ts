import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserPermissions } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    
    if (!buildingId) {
      return new NextResponse('Building ID is required', { status: 400 });
    }

    const permissions = await getUserPermissions(user.id, buildingId);
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}