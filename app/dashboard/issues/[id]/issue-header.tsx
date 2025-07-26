"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, X, MoreHorizontal, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const severityColors: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-green-100 text-green-800 border-green-300",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-300",
  AWAITING_LANDLORD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  RESOLVED: "bg-green-100 text-green-800 border-green-300",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-300",
};

interface IssueHeaderProps {
  issue: {
    id: string;
    title: string;
    severity: string;
    status: string;
  };
  isReporter: boolean;
  isAdmin: boolean;
  onEditClick: () => void;
}

export function IssueHeader({ issue, isReporter, isAdmin, onEditClick }: IssueHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => router.push('/dashboard/issues/my')}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to issues"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold truncate max-w-md">{issue.title}</h1>
        <div className="flex gap-2">
          <Badge className={severityColors[issue.severity]}>
            {issue.severity}
          </Badge>
          <Badge className={statusColors[issue.status]}>
            {issue.status}
          </Badge>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(isReporter || isAdmin) && (
            <DropdownMenuItem onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Issue
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push(`/dashboard/communications/new?issueId=${issue.id}`)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Log Communication
          </DropdownMenuItem>
          {(isReporter || isAdmin) && issue.status !== 'CLOSED' && (
            <DropdownMenuItem 
              onClick={async () => {
                const response = await fetch(`/api/issues/${issue.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'CLOSED' }),
                });
                if (response.ok) {
                  router.refresh();
                }
              }}
              className="text-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Close Issue
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}