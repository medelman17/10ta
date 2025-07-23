"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  User, 
  FileText,
  Building,
  CalendarIcon,
  Loader2,
  Upload,
  X,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";
// import TemplateSelector from "@/components/communications/template-selector";

interface CommunicationFormProps {
  userId: string;
  unitId?: string;
  issueId?: string;
  availableIssues?: Array<{
    id: string;
    title: string;
    createdAt: Date;
    status: string;
    category: string;
  }>;
}

const communicationTypes = [
  { value: "PHONE_CALL", label: "Phone Call", icon: Phone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "TEXT_MESSAGE", label: "Text Message", icon: MessageSquare },
  { value: "IN_PERSON", label: "In Person", icon: User },
  { value: "WRITTEN_LETTER", label: "Written Letter", icon: FileText },
  { value: "PORTAL_MESSAGE", label: "Portal Message", icon: Building },
];

const contactRoles = [
  "Landlord",
  "Property Manager",
  "Superintendent",
  "Maintenance Staff",
  "Management Company",
  "Legal Representative",
  "Other"
];

export default function SimpleCommunicationForm({ issueId: initialIssueId, availableIssues = [] }: CommunicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [type, setType] = useState("EMAIL");
  const [direction, setDirection] = useState("SENT");
  const [communicationDate, setCommunicationDate] = useState<Date>(new Date());
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const [issueId, setIssueId] = useState(initialIssueId || "");
  // const [appliedTemplate, setAppliedTemplate] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!content || content.length < 10) {
      toast.error("Please provide more details about this communication");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("direction", direction);
      formData.append("communicationDate", communicationDate.toISOString());
      formData.append("subject", subject);
      formData.append("content", content);
      formData.append("contactName", contactName);
      formData.append("contactRole", contactRole);
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone);
      formData.append("followUpRequired", String(followUpRequired));
      if (followUpDate) {
        formData.append("followUpDate", followUpDate.toISOString());
      }
      if (issueId && issueId !== "none") {
        formData.append("issueId", issueId);
      }
      
      // Add files
      files.forEach(file => {
        formData.append("files", file);
      });
      
      const response = await fetch("/api/communications", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to log communication");
      }

      toast.success("Communication logged successfully");
      router.push("/dashboard/communications/history");
    } catch {
      toast.error("Failed to log communication. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // const handleTemplateApply = (templateSubject: string, templateContent: string, templateName: string) => {
  //   setSubject(templateSubject);
  //   setContent(templateContent);
  //   setAppliedTemplate(templateName);
  // };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Link to Issue */}
      {availableIssues.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Link to Issue</CardTitle>
            <CardDescription>
              Connect this communication to an existing issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={issueId} onValueChange={setIssueId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an issue (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No issue selected</SelectItem>
                {availableIssues.map((issue) => (
                  <SelectItem key={issue.id} value={issue.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{issue.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {issue.category} • {issue.status} • {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Template Selection - Temporarily Hidden */}
      {/* <TemplateSelector onTemplateApply={handleTemplateApply} /> */}
      
      {/* {appliedTemplate && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✓ Applied template: <strong>{appliedTemplate}</strong>
          </p>
        </div>
      )} */}

      {/* Quick Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Type</CardTitle>
          <CardDescription>
            Select how this communication took place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {communicationTypes.map((commType) => {
              const Icon = commType.icon;
              const isSelected = type === commType.value;
              return (
                <Button
                  key={commType.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="h-12 flex flex-col items-center justify-center gap-1"
                  onClick={() => setType(commType.value)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{commType.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor="direction">Direction</Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SENT">Sent (You → Landlord)</SelectItem>
                <SelectItem value="RECEIVED">Received (Landlord → You)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !communicationDate && "text-muted-foreground"
                  )}
                >
                  {communicationDate ? (
                    format(communicationDate, "PPP 'at' p")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={communicationDate}
                  onSelect={(date) => date && setCommunicationDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief summary of the communication"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Details *</Label>
            <Textarea
              id="content"
              placeholder="Describe what was discussed, any commitments made, important details..."
              className="min-h-[150px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Be as detailed as possible. This record may be important later.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="Who did you communicate with?"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactRole">Contact Role</Label>
              <Select value={contactRole} onValueChange={setContactRole}>
                <SelectTrigger id="contactRole">
                  <SelectValue placeholder="Select their role" />
                </SelectTrigger>
                <SelectContent>
                  {contactRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(type === "EMAIL" || type === "PORTAL_MESSAGE") && (
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="their.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            )}

            {(type === "PHONE_CALL" || type === "TEXT_MESSAGE") && (
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Follow-up Required</Label>
                <div className="text-sm text-muted-foreground">
                  Do you need to follow up on this communication?
                </div>
              </div>
              <Switch
                checked={followUpRequired}
                onCheckedChange={setFollowUpRequired}
              />
            </div>

            {followUpRequired && (
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !followUpDate && "text-muted-foreground"
                      )}
                    >
                      {followUpDate ? (
                        format(followUpDate, "PPP")
                      ) : (
                        <span>Pick a follow-up date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Attachments</h3>
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Drop files here or click to upload
                    </span>
                    <span className="text-xs text-gray-500">
                      Images, PDFs, and documents up to 10MB each
                    </span>
                  </div>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                />
              </Label>
              
              {files.length > 0 && (
                <div className="space-y-2 mt-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Communication
        </Button>
      </div>
    </form>
  );
}