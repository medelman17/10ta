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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to 10ta</h1>
          <p className="mt-2 text-muted-foreground">
            Let's get you set up with your building and unit
          </p>
        </div>
        
        <OnboardingForm buildings={buildings} userId={user.id} />
      </div>
    </div>
  );
}