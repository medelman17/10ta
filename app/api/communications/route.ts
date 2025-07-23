import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationType } from "@prisma/client";
import { put } from "@vercel/blob";
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { isUserInBuilding } from '@/lib/api-access-helpers';

export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get("issueId");
    const type = searchParams.get("type");
    const followUpRequired = searchParams.get("followUpRequired");
    const buildingId = searchParams.get("buildingId");
    
    // Get building ID from user context if not provided
    let targetBuildingId = buildingId;
    if (!targetBuildingId) {
      const currentTenancy = user.tenancies.find(t => t.isCurrent);
      if (!currentTenancy) {
        return createErrorResponse(400, 'No building association found');
      }
      targetBuildingId = currentTenancy.unit.buildingId;
    }

    // Verify user is in the building
    const userInBuilding = await isUserInBuilding(user.id, targetBuildingId);
    if (!userInBuilding) {
      return createErrorResponse(403, 'You do not have access to this building');
    }

    // Check if user can view all communications or just their own
    const canViewAll = await hasPermission(
      user.id,
      targetBuildingId,
      PERMISSIONS.VIEW_ALL_COMMUNICATIONS
    );

    const whereClause = {
      ...(issueId && { issueId }),
      ...(type && { type: type as CommunicationType }),
      ...(followUpRequired && { followUpRequired: followUpRequired === "true" }),
      // If user can't view all, restrict to their own communications
      ...(!canViewAll && { userId: user.id }),
    };
    
    const communications = await prisma.communication.findMany({
      where: whereClause,
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
    return createErrorResponse(500, 'Internal server error');
  }
});

export const POST = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const direction = formData.get("direction") as string;
    const communicationDate = formData.get("communicationDate") as string;
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const contactName = formData.get("contactName") as string;
    const contactRole = formData.get("contactRole") as string;
    const contactEmail = formData.get("contactEmail") as string;
    const contactPhone = formData.get("contactPhone") as string;
    const followUpRequired = formData.get("followUpRequired") === "true";
    const followUpDate = formData.get("followUpDate") as string | null;
    const issueId = formData.get("issueId") as string | null;
    
    // Handle file uploads
    const files = formData.getAll("files") as File[];
    const mediaUrls: { url: string; fileName: string; fileSize: number; mimeType: string }[] = [];
    
    for (const file of files) {
      if (file.size > 0) {
        const blob = await put(`communications/${Date.now()}-${file.name}`, file, {
          access: "public",
        });
        mediaUrls.push({
          url: blob.url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }
    }

    // Create the communication
    const communication = await prisma.communication.create({
      data: {
        userId: user.id,
        type: type as CommunicationType,
        direction: direction as "SENT" | "RECEIVED",
        communicationDate: new Date(communicationDate),
        subject,
        content,
        contactName,
        contactRole,
        contactEmail,
        contactPhone,
        participants: [],
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        issueId: issueId || undefined,
        media: {
          create: mediaUrls.map(media => ({
            url: media.url,
            type: media.mimeType.startsWith("image/") ? "IMAGE" : "DOCUMENT",
            fileName: media.fileName,
            fileSize: media.fileSize,
            mimeType: media.mimeType,
            uploadedBy: user.id,
          })),
        },
      },
      include: {
        issue: true,
        media: true,
      },
    });

    return NextResponse.json(communication);
  } catch (error) {
    console.error("Error creating communication:", error);
    return createErrorResponse(500, 'Internal server error');
  }
});