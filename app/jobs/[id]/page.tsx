"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProposalCard } from "@/components/jobs/ProposalCard";
import { SubmitProposalModal } from "@/components/proposals/SubmitProposalModal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Radio,
  AlertCircle,
  Send,
  CheckCircle,
  Clock,
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
  const router = useRouter();
  const { roles } = useUser();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });

  // Fetch proposals from the dedicated buyer endpoint.
  // If this returns 403 the user is not the buyer — we treat isBuyer as false.
  const {
    data: proposals,
    isLoading: proposalsLoading,
    isError: proposalsForbidden,
  } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => api.getProposalsForJob(id),
    enabled: !!id,
    retry: false, // don't retry 403s
  });

  // Fetch agent profiles for the proposal modal (only needed for agent listers)
  const isAgentLister = roles.includes("AGENT_LISTER");
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: isAgentLister,
  });

  const isBuyer = !proposalsForbidden && proposals !== undefined;
  const myAgents = me?.agentProfiles ?? [];

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

  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;
  // For agent view — find their own proposal inside the minimal list from getJob
  const myProposalStub = !isBuyer
    ? job.proposals?.find((p) => p.status !== undefined)
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
            {proposals?.length ?? job.proposals?.length ?? 0} proposal
            {(proposals?.length ?? job.proposals?.length ?? 0) !== 1 ? "s" : ""} received
          </span>
        </div>
      )}

      {/* Agent view — own proposal stub */}
      {!isBuyer && myProposalStub && (
        <div className="mb-6">
          <h2 className="text-foreground font-display font-semibold mb-3">Your Proposal</h2>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[#b57e04] font-medium font-ui">
                <DollarSign className="w-4 h-4" />
                {myProposalStub.price} {myProposalStub.currency}
              </span>
              <Badge className={`text-xs border ${STATUS_CONFIG[myProposalStub.status as keyof typeof STATUS_CONFIG]?.class ?? ""}`}>
                {myProposalStub.status}
              </Badge>
            </div>
            {myProposalStub.status === "PENDING" && (
              <p className="text-muted-foreground text-xs font-ui mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Waiting for the buyer to review your proposal.
              </p>
            )}
            {myProposalStub.status === "ACCEPTED" && (
              <p className="text-muted-foreground text-xs font-ui mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Accepted! Check your active contracts to proceed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Agent view — no proposal yet, show submit button */}
      {!isBuyer && !myProposalStub && isAgentLister && job.status === "OPEN" && (
        <div className="mb-6">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#b57e04]/10 flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-[#b57e04]" />
            </div>
            <h3 className="text-foreground font-semibold font-ui mb-1">Submit a Proposal</h3>
            <p className="text-muted-foreground text-sm font-ui mb-4 max-w-sm">
              Pitch your agent for this task. Explain your approach, set your price, and estimated delivery time.
            </p>
            <Button
              onClick={() => setProposalModalOpen(true)}
              disabled={myAgents.length === 0}
              className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
            >
              <Send className="w-4 h-4" />
              Submit Proposal
            </Button>
            {myAgents.length === 0 && (
              <p className="text-muted-foreground text-xs font-ui mt-2">
                You need to register an agent first.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Buyer view — all proposals */}
      {isBuyer && (
        <div>
          <h2 className="text-foreground font-display font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Proposals ({proposals?.length ?? 0})
          </h2>

          {proposalsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : !proposals || proposals.length === 0 ? (
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
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isBuyer={job.status === "OPEN"}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit proposal modal */}
      {isAgentLister && job && (
        <SubmitProposalModal
          open={proposalModalOpen}
          onClose={() => setProposalModalOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
          agents={myAgents}
        />
      )}
    </div>
  );
}
