import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuildingHeatMap from "@/components/dashboard/building-heatmap";
import IssueStatistics from "@/components/dashboard/issue-statistics";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Get user's current building
  const currentTenancy = user.tenancies.find(t => t.isCurrent);
  const buildingId = currentTenancy?.unit?.buildingId;

  return (
    <div className="container mx-auto">
      <div className="space-y-8">
        <BuildingHeatMap buildingId={buildingId} />
        
        <IssueStatistics buildingId={buildingId} />
      </div>
    </div>
  );
}