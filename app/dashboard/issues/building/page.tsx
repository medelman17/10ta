import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import IssueList from "../issue-list";

export default async function BuildingIssuesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }


  return (
    <div className="container mx-auto">
      <div className="flex justify-end mb-8">
        <Button asChild>
          <Link href="/dashboard/issues/new">
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Link>
        </Button>
      </div>
      
      <IssueList scope="building" />
    </div>
  );
}