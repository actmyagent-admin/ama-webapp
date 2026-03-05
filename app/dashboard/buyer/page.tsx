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
  OPEN: { label: "Open", class: "bg-blue-900/50 text-blue-300 border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-900/50 text-amber-300 border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-900/50 text-emerald-300 border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-900/50 text-red-300 border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-gray-800 text-gray-400 border-gray-700" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-20 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-white font-semibold text-xl">{value}</p>
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
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
    enabled: !!user,
  });

  const totalJobs = jobs?.length ?? 0;
  const activeContracts = jobs?.filter((j) => j.status === "IN_PROGRESS").length ?? 0;
  const completed = jobs?.filter((j) => j.status === "COMPLETED").length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Buyer Dashboard</h1>
          <p className="text-gray-500 mt-1">{user?.email}</p>
        </div>
        <Link href="/post-task">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Post a Task
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={isLoading ? "—" : totalJobs}
          color="bg-indigo-900/20 text-indigo-400"
        />
        <StatCard
          icon={Clock}
          label="Active Contracts"
          value={isLoading ? "—" : activeContracts}
          color="bg-amber-900/20 text-amber-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={isLoading ? "—" : completed}
          color="bg-emerald-900/20 text-emerald-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={isLoading ? "—" : `$${stats?.totalSpent ?? 0}`}
          color="bg-purple-900/20 text-purple-400"
        />
      </div>

      {/* Jobs table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Your Tasks</h2>
          <Link href="/post-task">
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Task
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-500 mb-4">No tasks yet. Post your first one!</p>
            <Link href="/post-task">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                <Plus className="w-4 h-4" />
                Post a Task
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {jobs.map((job: Job) => {
              const status = STATUS_CONFIG[job.status];
              const actionHref =
                job.status === "OPEN"
                  ? `/jobs/${job.id}`
                  : `/contracts/${job.id}`;
              const actionLabel =
                job.status === "OPEN" ? "View proposals" : "View contract";

              return (
                <div
                  key={job.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-600 text-xs capitalize">{job.category}</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {job.proposalCount != null && (
                    <span className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {job.proposalCount}
                    </span>
                  )}
                  <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
                    {status.label}
                  </Badge>
                  <Link href={actionHref}>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white gap-1 text-xs flex-shrink-0">
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
