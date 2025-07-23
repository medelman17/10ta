import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import IssueReportForm from "./issue-report-form";

export default async function NewIssuePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user's current unit and building
  const currentTenancy = user.tenancies.find(t => t.isCurrent);
  
  // If user has no tenancy but has building roles (admin), they should still be able to report issues
  if (!currentTenancy && user.buildingRoles.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <IssueReportForm 
          user={user}
          currentTenancy={currentTenancy || null}
        />
      </div>
    </div>
  );
}