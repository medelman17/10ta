import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "./issue-detail-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
        },
      },
      building: {
        select: {
          name: true,
        },
      },
      media: true,
      _count: {
        select: {
          communications: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  // Check if user has access to this issue
  const isReporter = issue.reporterId === user.id;
  const isAdmin = user.buildingRoles.some(
    (role) => role.buildingId === issue.buildingId && role.role === "BUILDING_ADMIN"
  );
  const canViewPrivate = isReporter || isAdmin;

  if (!issue.isPublic && !canViewPrivate) {
    notFound();
  }

  // Fetch related communications
  const communications = await prisma.communication.findMany({
    where: {
      issueId: issue.id,
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      direction: true,
      communicationDate: true,
      subject: true,
      contactName: true,
    },
    orderBy: {
      communicationDate: 'desc',
    },
    take: 5,
  });

  // Convert to plain objects for client component
  const plainIssue = JSON.parse(JSON.stringify(issue));
  const plainCommunications = JSON.parse(JSON.stringify(communications));

  return (
    <IssueDetailClient 
      issue={plainIssue}
      communications={plainCommunications}
      isReporter={isReporter}
      isAdmin={isAdmin}
    />
  );
}