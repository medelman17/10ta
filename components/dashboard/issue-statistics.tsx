"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Loader2 
} from "lucide-react";

interface IssueStatistics {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  bySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    newIssues: number;
    resolvedIssues: number;
  }>;
  resolutionTimes: {
    emergency: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface IssueStatisticsProps {
  buildingId?: string;
  timeRange?: string;
}

const COLORS = {
  category: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"],
  severity: {
    EMERGENCY: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#3b82f6",
  },
  status: {
    OPEN: "#ef4444",
    IN_PROGRESS: "#f59e0b",
    AWAITING_LANDLORD: "#8b5cf6",
    RESOLVED: "#10b981",
    CLOSED: "#6b7280",
  },
};

export default function IssueStatistics({ buildingId, timeRange = "30d" }: IssueStatisticsProps) {
  const [statistics, setStatistics] = useState<IssueStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const params = new URLSearchParams();
        if (buildingId) params.append("buildingId", buildingId);
        params.append("timeRange", timeRange);

        const response = await fetch(`/api/issues/statistics?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [buildingId, timeRange]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.overview.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.overview.open}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.overview.total > 0 
                ? `${Math.round((statistics.overview.open / statistics.overview.total) * 100)}% of total`
                : "No issues"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.overview.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being addressed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.overview.averageResolutionTime} days
            </div>
            <p className="text-xs text-muted-foreground">
              Time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="newIssues" 
                    name="New Issues"
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolvedIssues" 
                    name="Resolved"
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statistics.byCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS.category[index % COLORS.category.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.bySeverity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8">
                    {statistics.bySeverity.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS.severity[entry.severity as keyof typeof COLORS.severity]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Times */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Times by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.resolutionTimes).map(([severity, days]) => (
                <div key={severity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={severity === 'emergency' ? 'destructive' : 'default'}
                        className="capitalize"
                      >
                        {severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {days} days avg
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((days / 30) * 100, 100)}%`,
                        backgroundColor: COLORS.severity[severity.toUpperCase() as keyof typeof COLORS.severity],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.byStatus.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: COLORS.status[status.status as keyof typeof COLORS.status] 
                    }}
                  />
                  <span className="text-sm font-medium">
                    {status.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{status.count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({status.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}