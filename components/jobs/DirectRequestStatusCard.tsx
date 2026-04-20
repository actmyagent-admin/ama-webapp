"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/api";
import {
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  ArrowRight,
} from "lucide-react";

interface Props {
  job: Job;
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-red-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function DirectRequestStatusCard({ job }: Props) {
  const router = useRouter();
  const now = useNow(60_000); // update every 60 seconds

  const agent = job.targetAgent;
  const agentName = agent?.name ?? "the agent";
  const agentInitials = agentName.slice(0, 2).toUpperCase();
  const category = job.category; // slug — used for URL params
  const categoryName = job.categoryRef?.name ?? job.category;
  const status = job.directRequestStatus;

  // Progress bar calculation (PENDING state)
  const sentAt = job.directRequestSentAt
    ? new Date(job.directRequestSentAt).getTime()
    : null;
  const expiresAt = job.directRequestExpiresAt
    ? new Date(job.directRequestExpiresAt).getTime()
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
  const colorClass = getProgressColor(progressPct);

  const AgentAvatar = () => (
    <Avatar className="w-6 h-6 flex-shrink-0">
      {agent?.mainPic || agent?.avatarUrl ? (
        <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agentName} />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-[10px] font-bold">
          {agentInitials}
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (status === "PENDING") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#b57e04] flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground font-ui">
            Direct Request
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-ui">
            Sent to:
          </span>
          <AgentAvatar />
          <span className="text-xs font-medium text-foreground font-ui">
            {agentName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-ui">
            Status: Awaiting response
          </span>
          {hoursRemaining != null && (
            <span className="text-xs text-muted-foreground font-ui flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {hoursRemaining}h remaining
            </span>
          )}
        </div>

        {/* Time progress bar */}
        {totalWindow != null && (
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs font-ui border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1"
            >
              View Job
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 font-ui">
            Direct Request Accepted
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AgentAvatar />
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-ui">
            {agentName} sent you a proposal
          </span>
        </div>
        <Link href={`/jobs/${job.id}`}>
          <Button
            size="sm"
            className="mt-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-ui"
          >
            Review Proposal
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    );
  }

  if (status === "DECLINED") {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-800 dark:text-red-200 font-ui">
            Request Declined
          </span>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300 font-ui">
          {agentName} is unable to take this job.
        </p>
        {job.directRequestDeclineReason && (
          <p className="text-xs text-muted-foreground font-ui italic">
            &ldquo;{job.directRequestDeclineReason}&rdquo;
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(
                `/agents?category=${category}&from=direct_request_fallback`
              )
            }
            className="text-xs font-ui border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1"
          >
            Try Another Agent
          </Button>
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/post-task?category=${category}&description=${encodeURIComponent(job.description)}`
              )
            }
            className="text-xs gap-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
          >
            Post to Similar Agents
          </Button>
        </div>
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200 font-ui">
            Request Expired
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AgentAvatar />
          <p className="text-xs text-amber-700 dark:text-amber-300 font-ui">
            {agentName} didn&apos;t respond in time.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(
                `/agents?category=${category}&from=direct_request_fallback`
              )
            }
            className="text-xs font-ui border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1"
          >
            Try Another Agent
          </Button>
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/post-task?category=${category}&description=${encodeURIComponent(job.description)}`
              )
            }
            className="text-xs gap-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
          >
            Post to Similar Agents
          </Button>
        </div>
      </div>
    );
  }

  if (status === "BROADCAST_CONVERTED") {
    const proposalCount =
      (job.proposals?.length ?? 0) || (job.proposalCount ?? 0);
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200 font-ui">
            Opened to All Agents
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 font-ui">
          Your request was broadcast to all{" "}
          <span className="capitalize font-medium">{categoryName}</span> agents.
          {proposalCount > 0 && (
            <span className="font-semibold">
              {" "}
              {proposalCount} proposal{proposalCount !== 1 ? "s" : ""} received
              so far.
            </span>
          )}
        </p>
        <Link href={`/jobs/${job.id}`}>
          <Button
            size="sm"
            className="mt-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-ui"
          >
            View Proposals
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
