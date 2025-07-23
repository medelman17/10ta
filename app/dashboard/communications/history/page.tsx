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
      <div className="flex justify-end mb-8">
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