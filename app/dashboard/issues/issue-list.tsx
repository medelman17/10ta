"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Image as ImageIcon,
  Loader2 
} from "lucide-react";
import Image from "next/image";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  location: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  unit: {
    unitNumber: string;
  };
  building: {
    name: string;
  };
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
}

interface IssueListProps {
  scope: 'my' | 'building';
}

export default function IssueList({ scope }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`/api/issues?scope=${scope}`);
        if (response.ok) {
          const data = await response.json();
          setIssues(data);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIssues();
  }, [scope]);

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'default';
      case 'IN_PROGRESS': return 'default';
      case 'AWAITING_LANDLORD': return 'default';
      case 'RESOLVED': return 'secondary';
      case 'CLOSED': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="pest">Pest</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="noise">Noise</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {issues.length === 0 
                ? `No issues ${scope === 'my' ? 'reported' : 'found'} yet.`
                : "No issues match your current filters."
              }
            </p>
            {issues.length === 0 && scope === 'my' && (
              <Button className="mt-4" asChild>
                <a href="/dashboard/issues/new">Report Your First Issue</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{issue.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">
                        {issue.category}
                      </Badge>
                      <Badge variant={getStatusColor(issue.status)}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                      {issue.location && issue.location !== 'other' && (
                        <Badge variant="secondary">
                          {issue.location.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {issue.media.length > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">{issue.media.length}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {issue.description}
                </p>
                
                {/* Photos */}
                {issue.media.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {issue.media.slice(0, 4).map((media) => (
                      <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={media.url}
                          alt="Issue photo"
                          fill
                          className="object-cover hover:scale-105 transition-transform cursor-pointer"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          onClick={() => window.open(media.url, '_blank')}
                        />
                      </div>
                    ))}
                    {issue.media.length > 4 && (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                        +{issue.media.length - 4} more
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {scope === 'building' && issue.reporter && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {issue.reporter.firstName && issue.reporter.lastName
                            ? `${issue.reporter.firstName} ${issue.reporter.lastName}`
                            : issue.reporter.email.split('@')[0]
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Unit {issue.unit.unitNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}