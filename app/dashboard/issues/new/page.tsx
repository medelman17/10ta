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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Report an Issue</h1>
          <p className="text-muted-foreground mt-2">
            Document property issues with photos and get AI-powered categorization to help communicate with your landlord.
          </p>
        </div>
        
        <IssueReportForm 
          user={user}
          currentTenancy={currentTenancy}
        />
      </div>
    </div>
  );
}