import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import IssueList from "../issue-list";

export default async function MyIssuesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Issues</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage the issues you&apos;ve reported
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/issues/new">
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Link>
        </Button>
      </div>
      
      <IssueList scope="my" />
    </div>
  );
}