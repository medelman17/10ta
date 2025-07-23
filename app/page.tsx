import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, MessageCircle, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">10 Ocean</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tenant association platform to document issues, coordinate responses, and advocate for better living conditions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <CardTitle>Report Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Document maintenance issues with photos and track landlord communications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <CardTitle>Build Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with neighbors and coordinate collective responses to building-wide issues.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <CardTitle>Know Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access resources and tools to advocate effectively for better living conditions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="px-8">
            <Link href="/sign-in">
              Get Started
            </Link>
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Contact your building administrator for access
          </p>
        </div>
      </div>
    </div>
  );
}