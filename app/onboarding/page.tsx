import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Check if user already has a building assignment
  if (user.buildingRoles.length > 0) {
    redirect("/dashboard");
  }
  
  // Get all available buildings
  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to 10ta</h1>
          <p className="text-lg text-muted-foreground">
            Your tenant association platform
          </p>
        </div>
        
        <OnboardingForm buildings={buildings} userId={user.id} />
        
        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact your building administrator.
        </p>
      </div>
    </div>
  );
}