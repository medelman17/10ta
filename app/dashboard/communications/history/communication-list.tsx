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
  Phone, 
  Mail, 
  MessageSquare, 
  User, 
  FileText,
  Building,
  Calendar,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ArrowUpDown,
  ArrowDownUp
} from "lucide-react";
import { format } from "date-fns";

interface Communication {
  id: string;
  type: string;
  direction: string;
  communicationDate: string;
  subject: string | null;
  content: string;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpCompleted: boolean;
  resolved: boolean;
  createdAt: string;
  issue: {
    id: string;
    title: string;
  } | null;
  media: Array<{
    id: string;
    url: string;
    fileName: string;
    type: string;
    mimeType: string;
  }>;
}

const typeIcons = {
  PHONE_CALL: Phone,
  EMAIL: Mail,
  TEXT_MESSAGE: MessageSquare,
  IN_PERSON: User,
  WRITTEN_LETTER: FileText,
  PORTAL_MESSAGE: Building,
};

const typeLabels = {
  PHONE_CALL: "Phone Call",
  EMAIL: "Email",
  TEXT_MESSAGE: "Text Message",
  IN_PERSON: "In Person",
  WRITTEN_LETTER: "Written Letter",
  PORTAL_MESSAGE: "Portal Message",
};

export default function CommunicationList() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const sortBy = "date";
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const response = await fetch("/api/communications");
      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunications = communications
    .filter(comm => {
      const matchesSearch = 
        comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.contactName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || comm.type === typeFilter;
      
      const matchesFollowUp = 
        followUpFilter === "all" ||
        (followUpFilter === "required" && comm.followUpRequired && !comm.followUpCompleted) ||
        (followUpFilter === "completed" && comm.followUpCompleted);
      
      return matchesSearch && matchesType && matchesFollowUp;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.communicationDate).getTime();
        const dateB = new Date(b.communicationDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" 
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
    });

  const getDirectionBadge = (direction: string) => {
    return direction === "SENT" ? (
      <Badge variant="secondary" className="text-xs">
        <ArrowUpDown className="h-3 w-3 mr-1" />
        Sent
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        <ArrowDownUp className="h-3 w-3 mr-1" />
        Received
      </Badge>
    );
  };

  const getFollowUpStatus = (comm: Communication) => {
    if (!comm.followUpRequired) return null;
    
    if (comm.followUpCompleted) {
      return (
        <Badge variant="secondary" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Follow-up Complete
        </Badge>
      );
    }
    
    const followUpDate = comm.followUpDate ? new Date(comm.followUpDate) : null;
    const isOverdue = followUpDate && followUpDate < new Date();
    
    return (
      <Badge variant={isOverdue ? "destructive" : "default"} className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Follow-up {isOverdue ? "Overdue" : "Required"}
      </Badge>
    );
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search communications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Follow-up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="required">Follow-up Required</SelectItem>
                <SelectItem value="completed">Follow-up Complete</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Communications List */}
      {filteredCommunications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {communications.length === 0 
                ? "No communications logged yet."
                : "No communications match your current filters."
              }
            </p>
            {communications.length === 0 && (
              <Button className="mt-4" asChild>
                <a href="/dashboard/communications/new">Log Your First Communication</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCommunications.map((comm) => {
            const Icon = typeIcons[comm.type as keyof typeof typeIcons] || FileText;
            
            return (
              <Card key={comm.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {comm.subject || typeLabels[comm.type as keyof typeof typeLabels]}
                            </h3>
                            {getDirectionBadge(comm.direction)}
                            {getFollowUpStatus(comm)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(comm.communicationDate), "PPP")}
                            </span>
                            {comm.contactName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {comm.contactName}
                                {comm.contactRole && ` (${comm.contactRole})`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.content}
                        </p>
                        
                        {comm.issue && (
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Linked to issue:</span>
                              <a href={`/dashboard/issues/${comm.issue.id}`} className="font-medium hover:underline">
                                {comm.issue.title}
                              </a>
                            </Badge>
                          </div>
                        )}
                        
                        {comm.media.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{comm.media.length} attachment{comm.media.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {comm.media.map((file) => (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80 transition-colors"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{file.fileName}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}