"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Job, JobStatus, ContractStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditJobModal } from "@/components/jobs/EditJobModal";
import { DirectRequestStatusCard } from "@/components/jobs/DirectRequestStatusCard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  Pencil,
  Trash2,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const STATUS_CONFIG: Record<JobStatus, { label: string; class: string }> = {
  OPEN: { label: "Open", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
};

type FilterTab = "all" | "direct" | "broadcast" | "active" | "completed";

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

function contractStatus(job: Job): ContractStatus | null {
  return (job.contract?.status as ContractStatus) ?? null;
}

function isDirectRequest(job: Job): boolean {
  return (
    job.routingType === "DIRECT" || job.routingType === "DIRECT_THEN_BROADCAST"
  );
}

/** Sort rank: lower = higher in list */
function jobSortRank(job: Job): number {
  const cs = contractStatus(job);
  if (isDirectRequest(job) && job.directRequestStatus === "PENDING") return 0;
  if (cs === "SIGNED_BOTH") return 1;
  if (job.status === "IN_PROGRESS") return 2;
  if (
    job.status === "OPEN" &&
    ((job.proposals?.length ?? 0) > 0 || (job.proposalCount ?? 0) > 0)
  )
    return 3;
  if (
    job.status === "COMPLETED" ||
    job.status === "CANCELLED" ||
    cs === "VOIDED" ||
    cs === "COMPLETED"
  )
    return 5;
  return 4;
}

export default function BuyerDashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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

  const { mutate: confirmDelete, isPending: isDeleting, error: deleteError } = useMutation({
    mutationFn: (jobId: string) => api.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["buyer-stats"] });
      setDeleteJob(null);
    },
  });

  const sortedJobs = jobs
    ? [...jobs].sort((a, b) => jobSortRank(a) - jobSortRank(b))
    : [];

  const filteredJobs = sortedJobs.filter((job) => {
    if (activeTab === "all") return true;
    if (activeTab === "direct") return isDirectRequest(job);
    if (activeTab === "broadcast")
      return !isDirectRequest(job);
    if (activeTab === "active") return job.status === "IN_PROGRESS";
    if (activeTab === "completed")
      return job.status === "COMPLETED" || job.status === "CANCELLED";
    return true;
  });

  const pendingPaymentCount = jobs?.filter((j) => contractStatus(j) === "SIGNED_BOTH").length ?? 0;
  const pendingDirectCount = jobs?.filter((j) => isDirectRequest(j) && j.directRequestStatus === "PENDING").length ?? 0;

  const deleteErrorMsg =
    deleteError instanceof Error ? deleteError.message : deleteError ? "Failed to delete job" : null;

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "direct", label: "Direct Requests" },
    { key: "broadcast", label: "Broadcast" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

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

      {/* Pending direct request alert */}
      {pendingDirectCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#b57e04]/40 bg-[#b57e04]/8 px-5 py-4">
          <Target className="w-5 h-5 text-[#b57e04] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[#b57e04] font-semibold font-ui text-sm">
              {pendingDirectCount} direct request{pendingDirectCount > 1 ? "s" : ""} awaiting agent response
            </p>
            <p className="text-[#b57e04]/80 text-xs font-ui mt-0.5">
              Agents have a limited window to respond. Check the status below.
            </p>
          </div>
        </div>
      )}

      {/* Pending payment alert */}
      {pendingPaymentCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 font-semibold font-ui text-sm">
              {pendingPaymentCount} contract{pendingPaymentCount > 1 ? "s require" : " requires"} payment
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs font-ui mt-0.5">
              Contracts must be paid within 24 hours of both signatures or they will be voided.
            </p>
          </div>
        </div>
      )}

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

        {/* Filter tabs */}
        <div className="px-6 pt-3 pb-0 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-ui font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !filteredJobs || filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4 font-ui">
              {activeTab === "all"
                ? "No tasks yet. Post your first one!"
                : "No tasks match this filter."}
            </p>
            {activeTab === "all" && (
              <Link href="/post-task">
                <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium">
                  <Plus className="w-4 h-4" />
                  Post a Task
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredJobs.map((job: Job) => {
              const cs = contractStatus(job);
              const needsPayment = cs === "SIGNED_BOTH";
              const status = STATUS_CONFIG[job.status];
              const isDirect = isDirectRequest(job);
              const actionHref =
                job.status === "OPEN"
                  ? `/jobs/${job.id}`
                  : `/contracts/${job.contract?.id ?? job.id}`;
              const actionLabel = job.status === "OPEN" ? "View proposals" : "View contract";

              const hasProposals = (job.proposals?.length ?? 0) > 0 || (job.proposalCount ?? 0) > 0;
              const hasContract = !!job.contract;

              const editDisabledReason = hasProposals
                ? "Cannot edit: this job already has proposals"
                : null;
              const deleteDisabledReason = hasContract
                ? "Cannot delete: this job has an associated contract"
                : null;

              return (
                <div key={job.id} className="px-6 py-4">
                  {/* Direct request status card (shown for DIRECT jobs) */}
                  {isDirect && job.directRequestStatus && (
                    <div className="mb-3">
                      <DirectRequestStatusCard job={job} />
                    </div>
                  )}

                  {/* Regular job row */}
                  <div
                    className={`flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-lg ${needsPayment ? "border-l-4 border-amber-400 pl-3" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate text-sm font-ui flex items-center gap-1.5">
                        {isDirect && (
                          <Target className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0" />
                        )}
                        {job.title}
                      </p>
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

                    {needsPayment ? (
                      <Badge className="text-xs border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 flex-shrink-0">
                        Payment Required
                      </Badge>
                    ) : (
                      <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
                        {status.label}
                      </Badge>
                    )}

                    {/* View action */}
                    {needsPayment ? (
                      <Link href={`/contracts/${job.contract?.id ?? job.id}`}>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-400 text-white gap-1 text-xs flex-shrink-0 font-ui font-medium"
                        >
                          Pay Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={actionHref}>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-[#b57e04] gap-1 text-xs flex-shrink-0 font-ui">
                          {actionLabel}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}

                    {/* Kebab menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          disabled={!!editDisabledReason}
                          onClick={() => !editDisabledReason && setEditJob(job)}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="font-ui text-sm">Edit task</span>
                          {editDisabledReason && (
                            <span className="ml-auto text-[10px] text-muted-foreground leading-tight max-w-[80px] text-right">
                              Has proposals
                            </span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!!deleteDisabledReason}
                          onClick={() => !deleteDisabledReason && setDeleteJob(job)}
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="font-ui text-sm">Delete task</span>
                          {deleteDisabledReason && (
                            <span className="ml-auto text-[10px] text-muted-foreground leading-tight max-w-[80px] text-right">
                              Has contract
                            </span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <EditJobModal job={editJob} onClose={() => setEditJob(null)} />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteJob} onOpenChange={(open) => { if (!open) setDeleteJob(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Delete Task</DialogTitle>
            <DialogDescription className="font-ui text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">&ldquo;{deleteJob?.title}&rdquo;</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteErrorMsg && (
            <p className="text-red-600 dark:text-red-400 text-xs font-ui -mt-2">{deleteErrorMsg}</p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteJob(null)}
              disabled={isDeleting}
              className="font-ui text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteJob && confirmDelete(deleteJob.id)}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white font-ui text-sm"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
