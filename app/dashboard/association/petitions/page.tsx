import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Users, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react";

// Mock data - in a real app, this would come from the database
const mockPetitions = [
  {
    id: "1",
    title: "Improve Building Security Measures",
    description: "Request for additional security cameras, better lighting in common areas, and improved door locks.",
    createdBy: "Sarah K. (4B)",
    createdAt: "2025-01-20",
    status: "OPEN",
    signatures: 23,
    targetSignatures: 40,
    deadline: "2025-02-15",
    category: "Safety & Security"
  },
  {
    id: "2", 
    title: "Laundry Room Improvements",
    description: "Replace old washing machines and dryers, add more units, and improve ventilation.",
    createdBy: "Mike D. (7A)",
    createdAt: "2025-01-15",
    status: "OPEN",
    signatures: 31,
    targetSignatures: 30,
    deadline: "2025-02-10",
    category: "Building Amenities"
  },
  {
    id: "3",
    title: "Pest Control Service Upgrade",
    description: "Switch to more effective pest control service and implement monthly treatments.",
    createdBy: "Lisa M. (2C)",
    createdAt: "2025-01-10",
    status: "DELIVERED", 
    signatures: 42,
    targetSignatures: 25,
    deadline: "2025-01-25",
    category: "Health & Safety"
  }
];

export default async function PetitionsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const activePetitions = mockPetitions.filter(p => p.status === "OPEN");
  const completedPetitions = mockPetitions.filter(p => p.status === "DELIVERED" || p.status === "CLOSED");

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Petitions</h1>
          <p className="text-muted-foreground">
            Create and sign petitions to advocate for building improvements and tenant rights.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/association/petitions/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Petition
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Petitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePetitions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently collecting signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPetitions.reduce((sum, p) => sum + p.signatures, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all petitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground mt-1">Petitions delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">Tenants engaged</p>
          </CardContent>
        </Card>
      </div>

      {/* Petitions List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Petitions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="my">My Petitions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePetitions.map((petition) => (
            <Card key={petition.id} className="border rounded-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{petition.title}</h3>
                      <p className="text-sm text-muted-foreground">{petition.description}</p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {petition.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Created by {petition.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(petition.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{petition.signatures} of {petition.targetSignatures} signatures</span>
                      <span>{Math.round((petition.signatures / petition.targetSignatures) * 100)}%</span>
                    </div>
                    <Progress value={(petition.signatures / petition.targetSignatures) * 100} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {petition.signatures >= petition.targetSignatures ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Target Reached
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Sign Petition
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPetitions.map((petition) => (
            <Card key={petition.id} className="border rounded-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{petition.title}</h3>
                      <p className="text-sm text-muted-foreground">{petition.description}</p>
                    </div>
                    <Badge variant="default" className="ml-4 bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {petition.status === "DELIVERED" ? "Delivered" : "Closed"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Created by {petition.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{petition.signatures} signatures collected</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Completed on {new Date(petition.deadline).toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No petitions created yet</h3>
              <p className="text-muted-foreground mb-4">
                Start advocating for change by creating your first petition.
              </p>
              <Button asChild>
                <Link href="/dashboard/association/petitions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Petition
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}