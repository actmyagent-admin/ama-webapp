"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, Job, JobStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const STATUS_CONFIG: Record<JobStatus, { label: string; class: string }> = {
  OPEN: { label: "Open", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass: string;
}) {
  return (
    <Card className="gradient-border-card bg-card">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-ui">{label}</p>
          <p className="text-foreground font-semibold text-xl font-display">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useUser();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => api.getMyJobs(),
    enabled: !!user,
  });
  const { data: stats } = useQuery({
    queryKey: ["buyer-stats"],
    queryFn: () => api.getBuyerStats(),
    enabled: !!user,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Buyer Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-ui text-sm">{user?.email}</p>
        </div>
        <Link href="/post-task">
          <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            Post a Task
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Jobs Posted"
          value={isLoading ? "—" : (stats?.jobsPosted ?? "—")}
          iconClass="bg-[#b57e04]/10 text-[#b57e04]"
        />
        <StatCard
          icon={Clock}
          label="Active Contracts"
          value={isLoading ? "—" : (stats?.activeContracts ?? "—")}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={isLoading ? "—" : (stats?.completed ?? "—")}
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={isLoading ? "—" : `$${stats?.totalSpent ?? 0}`}
          iconClass="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
      </div>

      {/* Jobs table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground font-semibold font-ui">Your Tasks</h2>
          <Link href="/post-task">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground gap-1.5 text-xs font-ui">
              <Plus className="w-3.5 h-3.5" />
              New Task
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4 font-ui">No tasks yet. Post your first one!</p>
            <Link href="/post-task">
              <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium">
                <Plus className="w-4 h-4" />
                Post a Task
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job: Job) => {
              const status = STATUS_CONFIG[job.status];
              const actionHref =
                job.status === "OPEN"
                  ? `/jobs/${job.id}`
                  : `/contracts/${job.contract?.id ?? job.id}`;
              const actionLabel =
                job.status === "OPEN" ? "View proposals" : "View contract";

              return (
                <div
                  key={job.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate text-sm font-ui">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-muted-foreground text-xs capitalize font-ui">{job.category}</span>
                      <span className="text-muted-foreground text-xs font-ui">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {job.proposals != null && (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0 font-ui">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {job.proposals.length}
                    </span>
                  )}
                  <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
                    {status.label}
                  </Badge>
                  <Link href={actionHref}>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-[#b57e04] gap-1 text-xs flex-shrink-0 font-ui">
                      {actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
