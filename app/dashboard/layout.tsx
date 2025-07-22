import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  
  // Check if user needs onboarding
  if (user.buildingRoles.length === 0) {
    redirect("/onboarding");
  }
  
  // Check if user has admin access
  const isAdmin = user.buildingRoles.some(
    (role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN
  );
  return (
    <SidebarProvider>
      <AppSidebar user={user} isAdmin={isAdmin} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center gap-2">
            {/* Breadcrumb will go here */}
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}