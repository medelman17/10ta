import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import CommunicationList from "./communication-list";

export default async function CommunicationHistoryPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Communication History</h1>
          <p className="text-muted-foreground mt-2">
            Track all your interactions with landlords and property management
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/communications/new">
            <Plus className="h-4 w-4 mr-2" />
            Log Communication
          </Link>
        </Button>
      </div>
      
      <CommunicationList />
    </div>
  );
}