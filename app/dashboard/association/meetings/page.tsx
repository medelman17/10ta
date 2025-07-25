import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  MapPin,
  FileText,
  CheckCircle,
  Video
} from "lucide-react";

// Mock data - in a real app, this would come from the database
const mockMeetings = [
  {
    id: "1",
    title: "Monthly Board Meeting - January 2025",
    description: "Regular monthly meeting to discuss building issues, budget updates, and community matters.",
    scheduledFor: "2025-01-30T19:00:00",
    duration: 90, // minutes
    location: "Community Room",
    type: "Board Meeting",
    organizer: "Association Board",
    status: "scheduled",
    attendees: 12,
    rsvpCount: 8,
    agenda: [
      "Review December meeting minutes",
      "Budget update and expenses",
      "Security improvement proposal",
      "Laundry room renovation update"
    ]
  },
  {
    id: "2",
    title: "Emergency Building Safety Meeting", 
    description: "Discussion about recent security incidents and proposed safety measures.",
    scheduledFor: "2025-02-05T18:30:00",
    duration: 60,
    location: "Via Zoom",
    type: "Emergency Meeting",
    organizer: "Sarah K. (4B)",
    status: "scheduled",
    attendees: 0,
    rsvpCount: 15,
    agenda: [
      "Recent security incidents report",
      "Proposed security camera installation",
      "Building access improvements",
      "Neighbor watch program"
    ]
  },
  {
    id: "3",
    title: "December Board Meeting",
    description: "Year-end review and planning for 2025 improvements.",
    scheduledFor: "2024-12-28T19:00:00",
    duration: 120,
    location: "Community Room",
    type: "Board Meeting", 
    organizer: "Association Board",
    status: "completed",
    attendees: 18,
    rsvpCount: 16,
    agenda: [
      "2024 Year in review",
      "Budget planning for 2025",
      "Maintenance priorities",
      "Holiday party recap"
    ]
  }
];

export default async function MeetingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const upcomingMeetings = mockMeetings
    .filter(m => m.status === "scheduled" && new Date(m.scheduledFor) > new Date())
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    
  const pastMeetings = mockMeetings
    .filter(m => m.status === "completed" || new Date(m.scheduledFor) < new Date())
    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/association/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Next in 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Meetings held</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-muted-foreground mt-1">Of total tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">Pending completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
          <TabsTrigger value="my">My Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No upcoming meetings</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule a meeting to discuss community matters.
                </p>
                <Button asChild>
                  <Link href="/dashboard/association/meetings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="border rounded-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{meeting.title}</h3>
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        {meeting.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(meeting.scheduledFor).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(meeting.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration} min)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.location === "Via Zoom" ? (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{meeting.location}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Agenda</span>
                        <span className="text-sm text-muted-foreground">
                          {meeting.rsvpCount} RSVPs
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {meeting.agenda.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                        {meeting.agenda.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{meeting.agenda.length - 3} more items
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Organized by {meeting.organizer}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">
                          RSVP
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastMeetings.map((meeting) => (
            <Card key={meeting.id} className="border rounded-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      <p className="text-sm text-muted-foreground">{meeting.description}</p>
                    </div>
                    <Badge variant="default" className="ml-4 bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(meeting.scheduledFor).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{meeting.duration} minutes</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Organized by {meeting.organizer}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View Minutes
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No meetings organized yet</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first meeting to discuss important community matters.
              </p>
              <Button asChild>
                <Link href="/dashboard/association/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule First Meeting
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}