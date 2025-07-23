import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Get user data from Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return NextResponse.json({ error: "Failed to get Clerk user" }, { status: 500 });
      }

      // Create user in database
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
        },
      });

      return NextResponse.json({ 
        message: "User synced successfully", 
        user,
        isNew: true 
      });
    }

    return NextResponse.json({ 
      message: "User already exists", 
      user,
      isNew: false 
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ 
      error: "Failed to sync user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}