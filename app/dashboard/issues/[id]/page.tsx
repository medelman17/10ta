import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, UserIcon, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const severityColors = {
  EMERGENCY: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-green-100 text-green-800 border-green-300",
};

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-300",
  AWAITING_LANDLORD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  RESOLVED: "bg-green-100 text-green-800 border-green-300",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-300",
};

export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
        },
      },
      building: {
        select: {
          name: true,
        },
      },
      media: true,
      _count: {
        select: {
          communications: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  // Check if user has access to this issue
  const isReporter = issue.reporterId === user.id;
  const isAdmin = user.buildingRoles.some(
    (role) => role.buildingId === issue.buildingId && role.role === "BUILDING_ADMIN"
  );
  const canViewPrivate = isReporter || isAdmin;

  if (!issue.isPublic && !canViewPrivate) {
    notFound();
  }

  // Fetch related communications
  const communications = await prisma.communication.findMany({
    where: {
      issueId: issue.id,
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      direction: true,
      communicationDate: true,
      subject: true,
      contactName: true,
    },
    orderBy: {
      communicationDate: 'desc',
    },
    take: 5,
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard/issues/my">
          <Button variant="ghost" size="sm">
            ← Back to Issues
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue details card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{issue.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Reported on {new Date(issue.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={severityColors[issue.severity]}>
                    {issue.severity}
                  </Badge>
                  <Badge className={statusColors[issue.status]}>
                    {issue.status}
                  </Badge>
                </div>
              </div>
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
                    {issue.media.map((media) => (
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
                  {communications.map((comm) => (
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
  );
}