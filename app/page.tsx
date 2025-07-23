import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MessageCircle, ArrowRight, ClipboardList, BarChart, HandshakeIcon } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  
  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8" />
            <h1 className="text-3xl font-semibold">
              10 Ocean Tenant Association
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            A unified platform for tenants to document issues, coordinate responses, and advocate for better living conditions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">Across 8 units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Petitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground mt-1">24 signatures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground mt-1">Of 80 units</p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Issue Reporting & Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Document building issues with photos, track resolution progress, and maintain evidence trails with AI-powered categorization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Communication Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Log all landlord interactions, generate professional letters, and track response times with built-in templates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <BarChart className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Building Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize issue patterns with interactive heat maps, track trends over time, and identify systemic problems.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <HandshakeIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Community Organization</h3>
                    <p className="text-sm text-muted-foreground">
                      Create petitions, organize meetings, connect with neighbors, and coordinate collective actions securely.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Report an Issue</h3>
                  <p className="text-sm text-muted-foreground">Document building problems</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">View Resources</h3>
                  <p className="text-sm text-muted-foreground">Tenant rights & guides</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Join Association</h3>
                  <p className="text-sm text-muted-foreground">Connect with neighbors</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border rounded-lg bg-muted/50">
          <CardContent className="p-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-semibold">Get Started Today</h2>
              <p className="text-muted-foreground">
                Join your neighbors in documenting issues and advocating for better living conditions at 10 Ocean.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/sign-up">
                    Create Account
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Contact your building administrator for access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}