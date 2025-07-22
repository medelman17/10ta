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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Building Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Visualize issue patterns and trends across your building
        </p>
      </div>
      
      <div className="space-y-8">
        <BuildingHeatMap buildingId={buildingId} />
        
        <IssueStatistics buildingId={buildingId} />
      </div>
    </div>
  );
}