import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get("issueId");
    const type = searchParams.get("type");
    const followUpRequired = searchParams.get("followUpRequired");
    
    const communications = await prisma.communication.findMany({
      where: {
        userId: user.id,
        ...(issueId && { issueId }),
        ...(type && { type: type as CommunicationType }),
        ...(followUpRequired && { followUpRequired: followUpRequired === "true" }),
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
        media: true,
      },
      orderBy: {
        communicationDate: "desc",
      },
    });
    
    return NextResponse.json(communications);
  } catch (error) {
    console.error("Error fetching communications:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      direction,
      communicationDate,
      subject,
      content,
      contactName,
      contactRole,
      contactEmail,
      contactPhone,
      participants,
      followUpRequired,
      followUpDate,
      issueId,
    } = body;

    // Create the communication
    const communication = await prisma.communication.create({
      data: {
        userId: user.id,
        type,
        direction,
        communicationDate: new Date(communicationDate),
        subject,
        content,
        contactName,
        contactRole,
        contactEmail,
        contactPhone,
        participants: participants || [],
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        issueId,
      },
      include: {
        issue: true,
        media: true,
      },
    });

    return NextResponse.json(communication);
  } catch (error) {
    console.error("Error creating communication:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}