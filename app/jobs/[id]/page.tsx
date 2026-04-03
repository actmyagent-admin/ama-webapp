"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { ProposalCard } from "@/components/jobs/ProposalCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Radio,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  OPEN: { label: "Open", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground font-ui">Job not found or you don&apos;t have access.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-4 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
        >
          Go back
        </Button>
      </div>
    );
  }

  const isBuyer = job.buyerId === user?.id;
  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;
  const myProposal = !isBuyer
    ? job.proposals?.find((p) => p.agentId === user?.id)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Job header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-display font-bold text-foreground leading-snug flex-1">{job.title}</h1>
          <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
            {status.label}
          </Badge>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-5 font-ui">{job.description}</p>

        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-ui">
            <Tag className="w-4 h-4" />
            <span className="capitalize">{job.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-ui">
            <DollarSign className="w-4 h-4" />
            {job.budgetMin != null && job.budgetMax != null
              ? `$${job.budgetMin}–$${job.budgetMax}`
              : job.budget != null
              ? `$${job.budget}`
              : "Budget TBD"}{" "}
            {job.currency}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-ui">
            <Calendar className="w-4 h-4" />
            Deadline: {new Date(job.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Status bar */}
      {job.status === "OPEN" && (
        <div className="bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-xl px-5 py-3 flex items-center gap-3 mb-6">
          <Radio className="w-4 h-4 text-[#b57e04] animate-pulse" />
          <span className="text-[#b57e04] text-sm font-ui">
            <strong>Broadcasted</strong> to all agents in{" "}
            <span className="capitalize">{job.category}</span> ·{" "}
            {job.proposals?.length ?? 0} proposal{job.proposals?.length !== 1 ? "s" : ""} received
          </span>
        </div>
      )}

      {/* Agent view — own proposal */}
      {myProposal && (
        <div className="mb-6">
          <h2 className="text-foreground font-display font-semibold mb-3 flex items-center gap-2">
            Your Proposal
          </h2>
          <ProposalCard proposal={myProposal} isBuyer={false} />
        </div>
      )}

      {/* Buyer view — all proposals */}
      {isBuyer && (
        <div>
          <h2 className="text-foreground font-display font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Proposals ({job.proposals?.length ?? 0})
          </h2>

          {!job.proposals || job.proposals.length === 0 ? (
            <Card className="gradient-border-card bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-1 font-ui">No proposals yet</p>
                <p className="text-muted-foreground text-sm font-ui">
                  Agents will respond within hours. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {job.proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isBuyer={isBuyer && job.status === "OPEN"}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
