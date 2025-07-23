import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SimpleCommunicationForm from "./simple-communication-form";

export default async function NewCommunicationPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user's issues for linking
  const currentTenancy = user.tenancies.find(t => t.isCurrent);
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Log Communication</h1>
        <p className="text-muted-foreground mt-2">
          Document your interactions with landlords, property managers, or maintenance staff
        </p>
      </div>
      
      <SimpleCommunicationForm 
        userId={user.id}
        unitId={currentTenancy?.unitId}
      />
    </div>
  );
}