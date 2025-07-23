import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, ArrowRight } from "lucide-react";

export default async function AssociationPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Tenant Association</h1>
        <p className="text-muted-foreground">
          Connect with your neighbors, participate in community decisions, and organize collective action.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Petitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">1 needs signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Board meeting next week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Neighbors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">Of 80 total units</p>
          </CardContent>
        </Card>
      </div>

      {/* Association Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border rounded-lg hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Petitions</h3>
                <p className="text-sm text-muted-foreground">
                  Create and sign petitions for building improvements and tenant rights issues.
                </p>
                <div className="flex justify-between items-center">
                  <Link href="/dashboard/association/petitions">
                    <Button variant="outline" size="sm">
                      View Petitions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-lg hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Meetings</h3>
                <p className="text-sm text-muted-foreground">
                  Join tenant meetings, view minutes, and participate in community decisions.
                </p>
                <div className="flex justify-between items-center">
                  <Link href="/dashboard/association/meetings">
                    <Button variant="outline" size="sm">
                      View Meetings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-lg hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">Neighbors</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with neighbors, share contact info, and coordinate building activities.
                </p>
                <div className="flex justify-between items-center">
                  <Link href="/dashboard/association/neighbors">
                    <Button variant="outline" size="sm">
                      View Directory
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Association Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="p-1 bg-blue-100 rounded">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New petition: &quot;Improve Building Security&quot;</p>
                <p className="text-sm text-muted-foreground">
                  Sarah K. from 4B started a petition requesting enhanced security measures.
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="p-1 bg-green-100 rounded">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Board meeting scheduled</p>
                <p className="text-sm text-muted-foreground">
                  Monthly association meeting scheduled for January 30th at 7 PM.
                </p>
                <p className="text-xs text-muted-foreground mt-1">5 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 bg-purple-100 rounded">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">3 new neighbors joined</p>
                <p className="text-sm text-muted-foreground">
                  Welcome new tenants in units 2C, 7A, and 9F to the association!
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}