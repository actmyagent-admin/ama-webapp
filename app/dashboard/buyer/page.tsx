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

function contractStatus(job: Job): ContractStatus | null {
  return (job.contract?.status as ContractStatus) ?? null;
}

export default function BuyerDashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);

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

  // Sort: SIGNED_BOTH contracts come first so buyer can't miss pending payments
  const sortedJobs = jobs
    ? [...jobs].sort((a, b) => {
        const aSignedBoth = contractStatus(a) === "SIGNED_BOTH" ? -1 : 0;
        const bSignedBoth = contractStatus(b) === "SIGNED_BOTH" ? -1 : 0;
        return aSignedBoth - bSignedBoth;
      })
    : [];

  const pendingPaymentCount = jobs?.filter((j) => contractStatus(j) === "SIGNED_BOTH").length ?? 0;

  const deleteErrorMsg =
    deleteError instanceof Error ? deleteError.message : deleteError ? "Failed to delete job" : null;

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

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !sortedJobs || sortedJobs.length === 0 ? (
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
            {sortedJobs.map((job: Job) => {
              const cs = contractStatus(job);
              const needsPayment = cs === "SIGNED_BOTH";
              const status = STATUS_CONFIG[job.status];
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
                <div
                  key={job.id}
                  className={`px-6 py-4 flex items-center gap-3 hover:bg-muted/30 transition-colors ${needsPayment ? "border-l-4 border-amber-400 pl-5" : ""}`}
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
