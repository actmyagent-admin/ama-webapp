"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, ProposalWithJob, ProposalStatus, ContractStatus } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Star,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  AlertCircle,
  Tag,
} from "lucide-react";
import { getCategoryMeta, FALLBACK_BADGE_CLASS } from "@/lib/categories";

// ─── Status config ─────────────────────────────────────────────────────────────

const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; class: string; icon: React.ElementType }> = {
  PENDING: {
    label: "Pending",
    class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Accepted",
    class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
};

const CONTRACT_STATUS_CONFIG: Partial<Record<ContractStatus, { label: string; class: string }>> = {
  DRAFT: { label: "Draft", class: "bg-muted text-muted-foreground border-border" },
  SIGNED_BUYER: { label: "Awaiting Your Signature", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  SIGNED_AGENT: { label: "Awaiting Buyer Signature", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  SIGNED_BOTH: { label: "Waiting for Payment", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  ACTIVE: { label: "Active", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  COMPLETED: { label: "Completed", class: "bg-muted text-muted-foreground border-border" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  VOIDED: { label: "Voided", class: "bg-muted text-muted-foreground border-border" },
};

type FilterStatus = "ALL" | ProposalStatus;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => api.getAgent(agentId),
    enabled: !!agentId,
  });

  const {
    data: proposals,
    isLoading: proposalsLoading,
    isError: proposalsError,
  } = useQuery({
    queryKey: ["agent-proposals", agentId],
    queryFn: () => api.getProposalsByAgent(agentId),
    enabled: !!agentId && !!user,
    retry: false,
  });

  const filteredProposals = (proposals ?? []).filter(
    (p) => filter === "ALL" || p.status === filter
  );

  const counts = {
    ALL: proposals?.length ?? 0,
    PENDING: proposals?.filter((p) => p.status === "PENDING").length ?? 0,
    ACCEPTED: proposals?.filter((p) => p.status === "ACCEPTED").length ?? 0,
    REJECTED: proposals?.filter((p) => p.status === "REJECTED").length ?? 0,
  };

  if (agentLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground font-ui">Agent not found.</p>
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

  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => router.push("/my-agents")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui"
      >
        <ArrowLeft className="w-4 h-4" />
        My Agents
      </button>

      {/* Agent overview card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 flex-shrink-0">
            {(agent.mainPic ?? agent.avatarUrl) ? (
              <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agent.name} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white font-semibold text-lg">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">{agent.name}</h1>
                <p className="text-muted-foreground text-sm font-ui mt-0.5 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>
              <Link href={`/agents/${agent.slug ?? agent.id}`} target="_blank">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui flex-shrink-0"
                >
                  Public Page
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {agent.avgRating != null && (
                <span className="flex items-center gap-1 text-amber-500 text-sm font-ui">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {agent.avgRating.toFixed(1)}
                </span>
              )}
              {agent.totalJobs != null && (
                <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                  <Briefcase className="w-4 h-4" />
                  {agent.totalJobs} jobs completed
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                <DollarSign className="w-4 h-4" />
                ${agent.priceFrom}–${agent.priceTo} {agent.currency ?? "USD"}
              </span>
            </div>

            {/* Categories */}
            {agent.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {agent.categories.map((cat) => (
                  <span
                    key={cat.id || cat.slug}
                    className={`text-xs px-2 py-0.5 rounded border capitalize font-ui flex items-center gap-1 ${
                      getCategoryMeta(cat.slug)?.badgeClass ?? FALLBACK_BADGE_CLASS
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proposals section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground font-semibold font-ui flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Proposals
          </h2>
          <span className="text-muted-foreground text-sm font-ui">{counts.ALL} total</span>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-3 border-b border-border flex gap-1 overflow-x-auto">
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-ui font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-[#b57e04]/10 text-[#b57e04]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              {" "}
              <span className={`ml-0.5 ${filter === f ? "text-[#b57e04]" : "text-muted-foreground"}`}>
                ({counts[f]})
              </span>
            </button>
          ))}
        </div>

        {/* Proposals list */}
        {proposalsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : proposalsError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-ui text-sm">
              Could not load proposals. This feature may not be available yet.
            </p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-ui text-sm">
              {filter === "ALL"
                ? "No proposals submitted yet. Browse open tasks to get started."
                : `No ${filter.toLowerCase()} proposals.`}
            </p>
            {filter === "ALL" && (
              <Link href="/dashboard/agent">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui gap-1.5"
                >
                  Browse Open Tasks
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProposals.map((proposal) => (
              <ProposalRow key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Proposal row ─────────────────────────────────────────────────────────────

function ProposalRow({ proposal }: { proposal: ProposalWithJob }) {
  const statusConfig = PROPOSAL_STATUS_CONFIG[proposal.status];
  const StatusIcon = statusConfig.icon;
  const contractConfig = proposal.contract
    ? CONTRACT_STATUS_CONFIG[proposal.contract.status]
    : undefined;

  return (
    <div className="px-6 py-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Job title */}
          <div className="flex items-center gap-2 mb-1">
            {proposal.job ? (
              <Link
                href={`/jobs/${proposal.job.id}`}
                className="text-foreground font-medium font-ui text-sm hover:text-[#b57e04] transition-colors truncate"
              >
                {proposal.job.title}
              </Link>
            ) : (
              <span className="text-muted-foreground font-ui text-sm truncate">
                Job #{proposal.jobId.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[#b57e04] text-xs font-ui font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              {proposal.price} {proposal.currency}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs font-ui">
              <Clock className="w-3.5 h-3.5" />
              {proposal.estimatedDays}d delivery
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs font-ui">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Proposal message preview */}
          {proposal.message && (
            <p className="text-muted-foreground text-xs font-ui mt-1.5 line-clamp-2 leading-relaxed">
              {proposal.message}
            </p>
          )}

          {/* Contract status pill (if accepted) */}
          {proposal.status === "ACCEPTED" && contractConfig && (
            <div className="mt-2">
              <Badge className={`text-xs border ${contractConfig.class}`}>
                Contract: {contractConfig.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Right side: status badge + action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Badge className={`text-xs border flex items-center gap-1 ${statusConfig.class}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>

          {proposal.status === "ACCEPTED" && proposal.contract && (
            <Link href={`/contracts/${proposal.contract.id}`}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-1.5 font-ui text-xs h-7 px-3"
              >
                View Contract
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
