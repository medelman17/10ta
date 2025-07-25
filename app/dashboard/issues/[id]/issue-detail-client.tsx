"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, UserIcon, MessageSquare, Plus } from "lucide-react";
import { setHeaderAction } from "@/components/dashboard/page-header-context";
import { EditIssueSheet } from "@/components/issues/edit-issue-sheet";
import { IssueHeader } from "./issue-header";

interface IssueDetailClientProps {
  issue: any;
  communications: any[];
  isReporter: boolean;
  isAdmin: boolean;
}

export function IssueDetailClient({ issue, communications, isReporter, isAdmin }: IssueDetailClientProps) {
  const router = useRouter();
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  useEffect(() => {
    // Set up the header with title, badges, and actions
    setHeaderAction(
      <IssueHeader 
        issue={issue}
        isReporter={isReporter}
        isAdmin={isAdmin}
        onEditClick={() => setEditSheetOpen(true)}
      />,
      true // isCustom = true to indicate we're providing a custom header
    );

    return () => setHeaderAction(null);
  }, [issue, isReporter, isAdmin]);

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue details card */}
            <Card>
              <CardHeader>
                <CardDescription>
                  Reported on {new Date(issue.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {issue.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {issue.location || `Unit ${issue.unit.unitNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {issue.reporter.firstName} {issue.reporter.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Category: {issue.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{issue._count.communications} communications</span>
                  </div>
                </div>

                {/* Photos */}
                {issue.media.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {issue.media.map((media: any) => (
                        <div key={media.id} className="relative aspect-video">
                          <Image
                            src={media.url}
                            alt="Issue photo"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communications card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Related Communications</CardTitle>
                  <Link href={`/dashboard/communications/new?issueId=${issue.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Communication
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {communications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No communications logged for this issue yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {communications.map((comm: any) => (
                      <div
                        key={comm.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {comm.subject || comm.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {comm.direction} • {new Date(comm.communicationDate).toLocaleDateString()}
                            {comm.contactName && ` • ${comm.contactName}`}
                          </p>
                        </div>
                        <Link href="/dashboard/communications/history">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/communications/new?issueId=${issue.id}`} className="w-full">
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Log Communication
                  </Button>
                </Link>
                {isReporter && (
                  <Button className="w-full" variant="outline" disabled>
                    Update Status
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Issue metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Building</p>
                  <p className="font-medium">{issue.building.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-medium">{issue.unit.unitNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issue ID</p>
                  <p className="font-mono text-xs">{issue.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Visibility</p>
                  <p className="font-medium">
                    {issue.isPublic ? "Public" : "Private"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Issue Sheet */}
      {(isReporter || isAdmin) && (
        <EditIssueSheet
          issue={issue}
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
        />
      )}
    </>
  );
}