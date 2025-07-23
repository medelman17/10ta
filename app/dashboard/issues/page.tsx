import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Building2, Plus, TrendingUp } from "lucide-react";

export default async function IssuesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Issues</h1>
        <p className="text-muted-foreground mt-2">
          Report and track maintenance issues in your building
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Report New Issue */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Report New Issue
            </CardTitle>
            <CardDescription>
              Document a problem in your unit or building
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/issues/new">
                Report Issue
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Issues */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Issues
            </CardTitle>
            <CardDescription>
              View and manage issues you&apos;ve reported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/issues/my">
                View My Issues
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Building Issues */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Building Issues
            </CardTitle>
            <CardDescription>
              See all public issues in your building
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/issues/building">
                View Building Issues
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              View building-wide trends and heat maps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/analytics">
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Take clear photos</p>
              <p className="text-sm text-muted-foreground">
                Photos help maintenance understand and prioritize issues
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Be specific about location</p>
              <p className="text-sm text-muted-foreground">
                Include details like &quot;under kitchen sink&quot; or &quot;bedroom window&quot;
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Mark urgent issues appropriately</p>
              <p className="text-sm text-muted-foreground">
                Use &quot;Emergency&quot; only for immediate safety/habitability concerns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}