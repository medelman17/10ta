"use client"

import * as React from "react"
import {
  Building2,
  FileWarning,
  Home,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
  Calendar,
  HelpCircle,
  Shield,
  LogOut,
} from "lucide-react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Issues",
      url: "/dashboard/issues",
      icon: FileWarning,
      items: [
        {
          title: "My Issues",
          url: "/dashboard/issues/my",
        },
        {
          title: "Building Issues",
          url: "/dashboard/issues/building",
        },
        {
          title: "Report Issue",
          url: "/dashboard/issues/new",
        },
      ],
    },
    {
      title: "Communications",
      url: "/dashboard/communications",
      icon: MessageSquare,
      items: [
        {
          title: "Log Communication",
          url: "/dashboard/communications/new",
        },
        {
          title: "History",
          url: "/dashboard/communications/history",
        },
      ],
    },
    {
      title: "Association",
      url: "/dashboard/association",
      icon: Users,
      items: [
        {
          title: "Petitions",
          url: "/dashboard/association/petitions",
        },
        {
          title: "Meetings",
          url: "/dashboard/association/meetings",
        },
        {
          title: "Neighbors",
          url: "/dashboard/association/neighbors",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
  ],
  navSecondary: [
    {
      title: "Help & Resources",
      url: "/dashboard/help",
      icon: HelpCircle,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
  navAdmin: [
    {
      title: "Admin Dashboard",
      url: "/dashboard/admin",
      icon: Shield,
      items: [
        {
          title: "Manage Tenants",
          url: "/dashboard/admin/tenants",
        },
        {
          title: "Unit Management",
          url: "/dashboard/admin/units",
        },
        {
          title: "Access Control",
          url: "/dashboard/admin/access",
        },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentPropsWithoutRef<typeof Sidebar> {
  user?: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    tenancies?: Array<{
      unit: {
        unitNumber: string;
      };
    }>;
  };
  isAdmin?: boolean;
}

export function AppSidebar({ user, isAdmin, ...props }: AppSidebarProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const currentUnit = user?.tenancies?.[0]?.unit;
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || "User";
  
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };
    
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">10 Ocean</span>
                  <span className="truncate text-xs">Tenant Association</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={item.url}>
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={item.url}>
                                <span>{item.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <div className="flex items-center gap-2 w-full">
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0] || user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs">
                        {currentUnit ? `Unit ${currentUnit.unitNumber}` : "Tenant"}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" alignOffset={-8} side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {currentUnit && (
                      <p className="text-xs leading-none text-muted-foreground">
                        Unit {currentUnit.unitNumber}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}