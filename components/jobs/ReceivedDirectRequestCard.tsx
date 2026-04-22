"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitProposalModal } from "@/components/proposals/SubmitProposalModal";
import { DirectRequestJob, AgentProfile, DirectRequestStatus } from "@/lib/api";
import {
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Radio,
  ArrowRight,
  DollarSign,
  Send,
  User,
} from "lucide-react";

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DirectRequestStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Awaiting your response",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Proposal submitted",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  DECLINED: {
    label: "Declined",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
  BROADCAST_CONVERTED: {
    label: "Broadcast to all",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    icon: Radio,
  },
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-red-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  request: DirectRequestJob;
  /** Full AgentProfile for the targeted agent — used to pre-fill SubmitProposalModal */
  targetAgentProfile?: AgentProfile;
  /** Hide the "sent to {agent}" row when already on the agent's own page */
  hideAgentRow?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceivedDirectRequestCard({
  request,
  targetAgentProfile,
  hideAgentRow = false,
}: Props) {
  const [proposalOpen, setProposalOpen] = useState(false);
  const now = useNow(60_000);

  const status = request.directRequestStatus;
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = statusConfig?.icon ?? Target;

  // Timing (PENDING only)
  const sentAt = request.directRequestSentAt
    ? new Date(request.directRequestSentAt).getTime()
    : null;
  const expiresAt = request.directRequestExpiresAt
    ? new Date(request.directRequestExpiresAt).getTime()
    : null;
  const totalWindow = sentAt && expiresAt ? expiresAt - sentAt : null;
  const elapsed = sentAt ? now - sentAt : null;
  const progressPct =
    totalWindow && elapsed != null
      ? Math.min(100, Math.round((elapsed / totalWindow) * 100))
      : 0;
  const hoursRemaining =
    expiresAt != null
      ? Math.max(0, Math.floor((expiresAt - now) / 3_600_000))
      : null;

  // Derived state
  const alreadyProposed = (request.proposals?.length ?? 0) > 0;
  const hasContract = !!request.contract;
  const isPending = status === "PENDING";
  const canPropose = isPending && !alreadyProposed;

  // Buyer — name can be null if the user hasn't set one yet
  const buyer = request.buyer;
  const buyerDisplayName = buyer.name ?? `@${buyer.userName}`;
  const buyerInitials = buyerDisplayName.replace(/^@/, "").slice(0, 2).toUpperCase();

  // Agent
  const agentName = request.targetAgent?.name ?? "your agent";
  const agentInitials = agentName.slice(0, 2).toUpperCase();

  // Agents array for modal — prefer full profile, fall back to minimal object
  const agentsForModal: AgentProfile[] = targetAgentProfile
    ? [targetAgentProfile]
    : request.targetAgent
    ? [
        {
          id: request.targetAgent.id,
          name: request.targetAgent.name,
          slug: request.targetAgent.slug,
          mainPic: request.targetAgent.mainPic,
          description: "",
          categories: [],
          priceFrom: 0,
          priceTo: 0,
          currency: "USD",
        },
      ]
    : [];

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-[#b57e04]/40 transition-colors">
        {/* Header row: title + status badge */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-[#b57e04] flex-shrink-0" />
            <Link
              href={`/jobs/${request.id}`}
              className="text-sm font-semibold text-foreground font-ui truncate hover:text-[#b57e04] transition-colors"
            >
              {request.title}
            </Link>
          </div>
          {statusConfig && (
            <Badge
              className={`text-xs border flex items-center gap-1 flex-shrink-0 ${statusConfig.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {/* Category + budget */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-ui capitalize">
            {request.categoryRef?.name ?? request.category}
          </span>
          {request.budget != null && (
            <span className="flex items-center gap-1 text-xs text-[#b57e04] font-ui font-medium">
              <DollarSign className="w-3 h-3" />
              {request.budget} {request.currency ?? "USD"}
            </span>
          )}
          {request.desiredDeliveryDays != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
              <Clock className="w-3 h-3" />
              {request.desiredDeliveryDays}d requested
            </span>
          )}
        </div>

        {/* Buyer row */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 flex-shrink-0">
            {buyer.mainPic ? (
              <img src={buyer.mainPic} alt={buyerDisplayName} />
            ) : (
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                {buyerInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground font-ui">
            From{" "}
            <span className="text-foreground font-medium">{buyerDisplayName}</span>
            {buyer.name && buyer.userName && (
              <span className="text-muted-foreground"> @{buyer.userName}</span>
            )}
          </span>
        </div>

        {/* Which agent received this — only shown when viewing all agents */}
        {!hideAgentRow && request.targetAgent && (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 flex-shrink-0">
              {request.targetAgent.mainPic ? (
                <img
                  src={request.targetAgent.mainPic}
                  alt={agentName}
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-[10px] font-bold">
                  {agentInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs text-muted-foreground font-ui">
              Sent to{" "}
              <span className="text-foreground font-medium">{agentName}</span>
            </span>
          </div>
        )}

        {/* Broadcast note */}
        {request.broadcastOnDecline && isPending && (
          <div className="flex items-start gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2">
            <Radio className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 font-ui">
              Will broadcast to other agents if you decline or don&apos;t respond in time.
            </p>
          </div>
        )}

        {/* Time progress bar (PENDING only) */}
        {isPending && totalWindow != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-ui flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {hoursRemaining != null
                  ? `${hoursRemaining}h to respond`
                  : "Respond now"}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(progressPct)}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Already proposed note */}
        {alreadyProposed && isPending && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-ui flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Proposal already submitted — awaiting buyer review.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/jobs/${request.id}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs font-ui border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1"
            >
              View Job Details
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>

          {canPropose && agentsForModal.length > 0 && (
            <Button
              size="sm"
              onClick={() => setProposalOpen(true)}
              className="flex-1 text-xs gap-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
            >
              <Send className="w-3 h-3" />
              Send Proposal
            </Button>
          )}

          {alreadyProposed && request.proposals[0] && (
            <Link href={`/jobs/${request.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full text-xs gap-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
              >
                <User className="w-3 h-3" />
                View Proposal
              </Button>
            </Link>
          )}

          {hasContract && request.contract && (
            <Link href={`/contracts/${request.contract.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full text-xs gap-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
              >
                View Contract
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Proposal modal */}
      <SubmitProposalModal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        jobId={request.id}
        jobTitle={request.title}
        agents={agentsForModal}
        onSuccess={() => setProposalOpen(false)}
      />
    </>
  );
}
