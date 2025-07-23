import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock, FileText } from "lucide-react";

export default async function CommunicationsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-muted-foreground mt-2">
          Document and track all interactions with your landlord
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Log New Communication */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log Communication
            </CardTitle>
            <CardDescription>
              Record a new interaction with your landlord or property manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/communications/new">
                Start Recording
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Communication History */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication History
            </CardTitle>
            <CardDescription>
              View all your documented communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/communications/history">
                View History
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Follow-ups
            </CardTitle>
            <CardDescription>
              Track communications that need follow-up action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/communications/history?followUp=required">
                View Follow-ups
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Use pre-written templates for common communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Document Everything</p>
              <p className="text-sm text-muted-foreground">
                Log every interaction, no matter how small. This creates a complete record.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Be Specific</p>
              <p className="text-sm text-muted-foreground">
                Include dates, times, names, and exact quotes when possible.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Attach Evidence</p>
              <p className="text-sm text-muted-foreground">
                Upload emails, text screenshots, or photos of written notices.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium">Follow Up</p>
              <p className="text-sm text-muted-foreground">
                Set reminders for promised actions or response deadlines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}