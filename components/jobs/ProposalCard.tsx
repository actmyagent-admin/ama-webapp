"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { api, Proposal, ProposalStatus } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_CONFIG: Record<ProposalStatus, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-muted text-muted-foreground border-border" },
  ACCEPTED: {
    label: "Accepted",
    class:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  REJECTED: {
    label: "Rejected",
    class:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

interface ProposalCardProps {
  proposal: Proposal;
  isBuyer?: boolean;
}

export function ProposalCard({ proposal, isBuyer }: ProposalCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const agent = proposal.agentProfile;
  const initials = agent?.name?.slice(0, 2).toUpperCase() ?? "??";
  const status = STATUS_CONFIG[proposal.status];
  const isPending = proposal.status === "PENDING";

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { contract } = await api.acceptProposal(proposal.id);
      toast({ title: "Proposal accepted!", description: "A contract has been created." });
      queryClient.invalidateQueries({ queryKey: ["job", proposal.jobId] });
      router.push(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to accept proposal",
        variant: "destructive",
      });
      setAccepting(false);
      setConfirmAcceptOpen(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await api.rejectProposal(proposal.id);
      toast({ title: "Proposal rejected." });
      queryClient.invalidateQueries({ queryKey: ["job", proposal.jobId] });
      setConfirmRejectOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to reject proposal",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
      setConfirmRejectOpen(false);
    }
  };

  return (
    <>
      <Card className="gradient-border-card bg-card hover:shadow-md transition-all">
        <CardContent className="p-5">
          {/* Agent header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10 flex-shrink-0">
              {agent?.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-sm font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-medium truncate font-ui">
                  {agent?.name ?? "Anonymous Agent"}
                </p>
                <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-[#b57e04] text-sm font-medium font-ui">
                  <DollarSign className="w-3.5 h-3.5" />
                  {proposal.price} {proposal.currency}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                  <Clock className="w-3.5 h-3.5" />
                  {proposal.estimatedDays} day{proposal.estimatedDays !== 1 ? "s" : ""}
                </span>
                {agent?.avgRating != null && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Star className="w-3.5 h-3.5 text-[#b57e04]" />
                    {agent.avgRating.toFixed(1)}
                  </span>
                )}
                {agent?.totalJobs != null && agent.totalJobs > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Briefcase className="w-3.5 h-3.5" />
                    {agent.totalJobs} job{agent.totalJobs !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Proposal message preview */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 font-ui">
            {proposal.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailOpen(true)}
              className="gap-1.5 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui text-xs"
            >
              View full proposal
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            {isBuyer && isPending && (
              <>
                <Button
                  size="sm"
                  onClick={() => setConfirmAcceptOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmRejectOpen(true)}
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 font-ui text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display flex items-center gap-3">
              <Avatar className="w-8 h-8">
                {agent?.avatarUrl ? (
                  <img src={agent.avatarUrl} alt={agent.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              {agent?.name ?? "Anonymous Agent"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-3 mt-1 flex-wrap pt-1">
                <span className="flex items-center gap-1 text-[#b57e04] text-sm font-medium font-ui">
                  <DollarSign className="w-3.5 h-3.5" />
                  {proposal.price} {proposal.currency}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                  <Clock className="w-3.5 h-3.5" />
                  {proposal.estimatedDays} day{proposal.estimatedDays !== 1 ? "s" : ""} delivery
                </span>
                {agent?.avgRating != null && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Star className="w-3.5 h-3.5 text-[#b57e04]" />
                    {agent.avgRating.toFixed(1)} rating
                  </span>
                )}
                {agent?.totalJobs != null && agent.totalJobs > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Briefcase className="w-3.5 h-3.5" />
                    {agent.totalJobs} job{agent.totalJobs !== 1 ? "s" : ""} completed
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <Separator className="bg-border" />

          {/* Full message */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">
              Proposal
            </p>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-ui">
              {proposal.message}
            </p>
          </div>

          {/* Agent description */}
          {agent?.description && (
            <>
              <Separator className="bg-border" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">
                  About this agent
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed font-ui line-clamp-4">
                  {agent.description}
                </p>
              </div>
            </>
          )}

          {/* Submitted at */}
          <p className="text-muted-foreground text-xs font-ui">
            Submitted {new Date(proposal.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {isBuyer && isPending && (
            <>
              <Separator className="bg-border" />
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDetailOpen(false); setConfirmRejectOpen(true); }}
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 font-ui"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setDetailOpen(false); setConfirmAcceptOpen(true); }}
                  className="gap-1.5 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept Proposal
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept confirm dialog */}
      <Dialog open={confirmAcceptOpen} onOpenChange={setConfirmAcceptOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              Accept this proposal?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              You&apos;re accepting the proposal from{" "}
              <span className="text-foreground">{agent?.name}</span> for{" "}
              <span className="text-[#b57e04] font-medium">
                ${proposal.price} {proposal.currency}
              </span>{" "}
              · {proposal.estimatedDays} days. All other proposals will be automatically
              rejected and a contract will be created.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAcceptOpen(false)}
              className="border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
            >
              {accepting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject confirm dialog */}
      <Dialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              Reject this proposal?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              The proposal from{" "}
              <span className="text-foreground">{agent?.name}</span> will be rejected.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRejectOpen(false)}
              className="border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejecting}
              variant="destructive"
              className="font-ui font-medium"
            >
              {rejecting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
