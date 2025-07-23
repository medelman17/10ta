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
  
  if (!currentTenancy) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <IssueReportForm 
          user={user}
          currentTenancy={currentTenancy}
        />
      </div>
    </div>
  );
}