import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SimpleCommunicationForm from "./simple-communication-form";

interface PageProps {
  searchParams: Promise<{ issueId?: string }>;
}

export default async function NewCommunicationPage({ searchParams }: PageProps) {
  const { issueId } = await searchParams;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user's issues for linking
  const currentTenancy = user.tenancies.find(t => t.isCurrent);
  
  // Fetch user's issues
  const issues = await prisma.issue.findMany({
    where: {
      reporterId: user.id,
      status: {
        in: ['OPEN', 'IN_PROGRESS']
      }
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
      category: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return (
    <div className="container mx-auto max-w-4xl">
      <SimpleCommunicationForm 
        userId={user.id}
        unitId={currentTenancy?.unitId}
        availableIssues={issues}
        issueId={issueId}
      />
    </div>
  );
}