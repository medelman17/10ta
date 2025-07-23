import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  MessageCircle,
  Shield,
  Settings,
  UserCheck,
  Building
} from "lucide-react";

// Mock data - in a real app, this would come from the database
const mockNeighbors = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "K.",
    unit: "4B",
    floor: 4,
    email: "sarah.k@email.com",
    phone: "(555) 123-4567",
    shareContactInfo: true,
    allowMessages: true,
    joinedDate: "2023-08-15",
    role: "Association Board",
    isActive: true,
    issuesReported: 3,
    petitionsSigned: 7
  },
  {
    id: "2", 
    firstName: "Mike",
    lastName: "D.",
    unit: "7A",
    floor: 7,
    email: "mike.d@email.com",
    phone: null,
    shareContactInfo: true,
    allowMessages: true,
    joinedDate: "2024-01-20",
    role: null,
    isActive: true,
    issuesReported: 1,
    petitionsSigned: 4
  },
  {
    id: "3",
    firstName: "Lisa",
    lastName: "M.",
    unit: "2C",
    floor: 2,
    email: "lisa.m@email.com", 
    phone: "(555) 987-6543",
    shareContactInfo: false,
    allowMessages: true,
    joinedDate: "2023-12-10",
    role: null,
    isActive: true,
    issuesReported: 5,
    petitionsSigned: 3
  },
  {
    id: "4",
    firstName: "Alex",
    lastName: "R.",
    unit: "9F",
    floor: 9,
    email: null,
    phone: null,
    shareContactInfo: false,
    allowMessages: false,
    joinedDate: "2024-11-05",
    role: null,
    isActive: true,
    issuesReported: 0,
    petitionsSigned: 1
  },
  {
    id: "5",
    firstName: "Jennifer",
    lastName: "W.",
    unit: "1A",
    floor: 1,
    email: "jen.w@email.com",
    phone: "(555) 456-7890",
    shareContactInfo: true,
    allowMessages: true,
    joinedDate: "2022-05-30",
    role: "Building Admin",
    isActive: true,
    issuesReported: 12,
    petitionsSigned: 8
  }
];

export default async function NeighborsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const activeNeighbors = mockNeighbors.filter(n => n.isActive);
  const neighborsByFloor = activeNeighbors.reduce((acc, neighbor) => {
    if (!acc[neighbor.floor]) {
      acc[neighbor.floor] = [];
    }
    acc[neighbor.floor].push(neighbor);
    return acc;
  }, {} as Record<number, typeof mockNeighbors>);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Neighbor Directory</h1>
          <p className="text-muted-foreground">
            Connect with your neighbors and build a stronger community.
          </p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Privacy Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Neighbors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNeighbors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Of 80 total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shared Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeNeighbors.filter(n => n.shareContactInfo).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Allow contact sharing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Floors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(neighborsByFloor).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Have registered tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Community Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground mt-1">Participation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900">Privacy Protected</h4>
              <p className="text-sm text-blue-800">
                Only neighbors who have opted to share their contact information are shown. 
                You can manage your own privacy settings at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, unit, or floor..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Neighbors List */}
      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">All Neighbors</TabsTrigger>
          <TabsTrigger value="floor">By Floor</TabsTrigger>
          <TabsTrigger value="active">Most Active</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeNeighbors.map((neighbor) => (
              <Card key={neighbor.id} className="border rounded-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {neighbor.firstName} {neighbor.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Unit {neighbor.unit}</span>
                        </div>
                      </div>
                      {neighbor.role && (
                        <Badge variant="secondary" className="text-xs">
                          {neighbor.role}
                        </Badge>
                      )}
                    </div>

                    {neighbor.shareContactInfo && (
                      <div className="space-y-2">
                        {neighbor.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{neighbor.email}</span>
                          </div>
                        )}
                        {neighbor.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{neighbor.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Joined {new Date(neighbor.joinedDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        <span>{neighbor.issuesReported + neighbor.petitionsSigned} actions</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {neighbor.allowMessages && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="floor" className="space-y-6">
          {Object.entries(neighborsByFloor)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([floor, neighbors]) => (
              <div key={floor} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Floor {floor}</h3>
                  <Badge variant="outline">{neighbors.length} residents</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-8">
                  {neighbors.map((neighbor) => (
                    <Card key={neighbor.id} className="border rounded-lg">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {neighbor.firstName} {neighbor.lastName}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                Unit {neighbor.unit}
                              </span>
                            </div>
                            {neighbor.role && (
                              <Badge variant="secondary" className="text-xs">
                                {neighbor.role}
                              </Badge>
                            )}
                          </div>
                          
                          {neighbor.shareContactInfo && neighbor.email && (
                            <div className="text-sm text-muted-foreground truncate">
                              {neighbor.email}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {neighbor.allowMessages && (
                              <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activeNeighbors
              .sort((a, b) => (b.issuesReported + b.petitionsSigned) - (a.issuesReported + a.petitionsSigned))
              .slice(0, 10)
              .map((neighbor, index) => (
                <Card key={neighbor.id} className="border rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {neighbor.firstName} {neighbor.lastName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Unit {neighbor.unit}</span>
                            {neighbor.role && (
                              <Badge variant="secondary" className="text-xs">
                                {neighbor.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{neighbor.issuesReported}</div>
                          <div className="text-muted-foreground">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{neighbor.petitionsSigned}</div>
                          <div className="text-muted-foreground">Petitions</div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}