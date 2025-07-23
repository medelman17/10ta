import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold text-lg">10 Ocean Tenant Association</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/about">About</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">Contact</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/blog">Blog</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/library">Resources</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Join</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-12 w-12" />
            <h1 className="text-4xl font-bold">
              10 Ocean Tenant Association
            </h1>
          </div>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
            A unified platform for tenants to document issues, coordinate responses, and advocate for better living conditions.
          </p>
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
              <p className="text-sm text-muted-foreground">
                Contact your building administrator for access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}