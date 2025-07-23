import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    // Find user by email
    const foundUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!foundUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(foundUser);
  } catch (error) {
    console.error('Error searching for user:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}