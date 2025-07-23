"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function DebugPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [debugData, setDebugData] = useState<{
    clerk: {
      authenticated: boolean;
      userId: string | null;
      user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      } | null;
    };
    database: {
      userExists: boolean;
      user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        buildingRoles: Array<{ id: string; role: string; buildingId: string }>;
        tenancies: Array<{ id: string; unitId: string; isCurrent: boolean }>;
      } | null;
    };
    webhook: {
      secretConfigured: boolean;
      secretFormat: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    message: string;
    user?: {
      id: string;
      clerkId: string;
      email: string;
    };
    isNew?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isLoaded) {
      fetchDebugData();
    }
  }, [isLoaded]);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/debug");
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error("Failed to fetch debug data:", error);
    }
    setLoading(false);
  };

  const syncUser = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/sync");
      const data = await response.json();
      setSyncResult(data);
      // Refresh debug data
      await fetchDebugData();
    } catch (error) {
      console.error("Failed to sync user:", error);
      setSyncResult({ message: "Failed to sync user", error: "Failed to sync user" });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

      {/* Clerk Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clerk Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Clerk Loaded:</span>
            <Badge variant={isLoaded ? "default" : "secondary"}>
              {isLoaded ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Signed In:</span>
            <Badge variant={isSignedIn ? "default" : "destructive"}>
              {isSignedIn ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>User ID:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {userId || "None"}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Debug Data */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : debugData ? (
        <>
          {/* Webhook Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Webhook Configuration
                {debugData.webhook?.secretFormat === 'correct' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Secret Configured:</span>
                <Badge variant={debugData.webhook?.secretConfigured ? "default" : "destructive"}>
                  {debugData.webhook?.secretConfigured ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Secret Format:</span>
                <Badge variant={debugData.webhook?.secretFormat === 'correct' ? "default" : "destructive"}>
                  {debugData.webhook?.secretFormat || "Unknown"}
                </Badge>
              </div>
              {debugData.webhook?.secretFormat !== 'correct' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Webhook secret is incorrectly configured!</p>
                      <p className="text-muted-foreground">
                        The CLERK_WEBHOOK_SECRET should be a signing secret starting with &apos;whsec_&apos;, not a URL.
                      </p>
                      <p className="text-muted-foreground mt-2">
                        To fix: Go to Clerk Dashboard → Webhooks → Copy the signing secret and update your .env.local file.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Database Status
                {debugData.database?.userExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>User Exists in DB:</span>
                <Badge variant={debugData.database?.userExists ? "default" : "destructive"}>
                  {debugData.database?.userExists ? "Yes" : "No"}
                </Badge>
              </div>
              {debugData.database?.user && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <span className="text-sm">{debugData.database.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Building Roles:</span>
                    <Badge>{debugData.database.user.buildingRoles.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tenancies:</span>
                    <Badge>{debugData.database.user.tenancies.length}</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={syncUser} 
                disabled={loading || !isSignedIn}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync User to Database"
                )}
              </Button>
              
              {syncResult && (
                <div className={`p-4 rounded-lg ${syncResult.error ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                </div>
              )}

              <Button 
                onClick={fetchDebugData} 
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                Refresh Debug Data
              </Button>
            </CardContent>
          </Card>

          {/* Raw Debug Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Debug Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded-lg">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}