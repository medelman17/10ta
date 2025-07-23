"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Calendar,
  Home,
  MessageSquare,
  Check,
  X,
  Mail,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RequestUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface UnitRequest {
  id: string;
  message: string | null;
  createdAt: string;
  user: RequestUser;
  requestedUnit: Unit | null;
}

interface PendingRequestsProps {
  requests: UnitRequest[];
}

export default function PendingRequests({ requests }: PendingRequestsProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<UnitRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  
  const handleApprove = async (request: UnitRequest) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/unit-requests/${request.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      
      if (!response.ok) throw new Error("Failed to approve request");
      
      toast.success("Request approved successfully");
      setSelectedRequest(null);
      setAdminNotes("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };
  
  const handleReject = async (request: UnitRequest) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/unit-requests/${request.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      
      if (!response.ok) throw new Error("Failed to reject request");
      
      toast.success("Request rejected");
      setSelectedRequest(null);
      setAdminNotes("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };
  
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Unit Requests</CardTitle>
          <CardDescription>
            No pending requests at this time
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Pending Unit Requests</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve tenant requests for unit assignments
          </p>
        </div>
        
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.user.firstName} {request.user.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.user.email}
                        </span>
                        {request.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Request Details */}
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Requested Unit: {" "}
                        <Badge variant="outline">
                          {request.requestedUnit ? request.requestedUnit.unitNumber : "Any Available"}
                        </Badge>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {request.message && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Message from tenant:</p>
                          <p className="text-muted-foreground mt-1">{request.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(request);
                      setAdminNotes("");
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Unit Request</DialogTitle>
            <DialogDescription>
              Approve or reject the unit assignment request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Applicant</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.user.firstName} {selectedRequest.user.lastName} ({selectedRequest.user.email})
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Requested Unit</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.requestedUnit ? 
                    `Unit ${selectedRequest.requestedUnit.unitNumber}` : 
                    "Any available unit"
                  }
                </p>
              </div>
              
              {selectedRequest.message && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tenant Message</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.message}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes (Optional)
                </label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleReject(selectedRequest!)}
              disabled={processing}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApprove(selectedRequest!)}
              disabled={processing}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}