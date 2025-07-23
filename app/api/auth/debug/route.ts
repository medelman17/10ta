import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    const clerkUser = await currentUser();
    
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          buildingRoles: true,
          tenancies: {
            include: {
              unit: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      clerk: {
        authenticated: !!userId,
        userId,
        user: clerkUser ? {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        } : null,
      },
      database: {
        userExists: !!dbUser,
        user: dbUser,
      },
      webhook: {
        secretConfigured: !!process.env.CLERK_WEBHOOK_SECRET,
        secretFormat: process.env.CLERK_WEBHOOK_SECRET?.startsWith('whsec_') ? 'correct' : 'incorrect',
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}