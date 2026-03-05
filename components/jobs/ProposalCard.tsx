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
import { DollarSign, Clock, Loader2, CheckCircle } from "lucide-react";
import { api, Proposal, ProposalStatus } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<ProposalStatus, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-muted text-muted-foreground border-border" },
  ACCEPTED: { label: "Accepted", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  REJECTED: { label: "Rejected", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
};

interface ProposalCardProps {
  proposal: Proposal;
  isBuyer?: boolean;
}

export function ProposalCard({ proposal, isBuyer }: ProposalCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const agent = proposal.agentProfile;
  const initials = agent?.name?.slice(0, 2).toUpperCase() ?? "??";
  const status = STATUS_CONFIG[proposal.status];

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const contract = await api.acceptProposal(proposal.id);
      toast({ title: "Proposal accepted!", description: "A contract has been created." });
      router.push(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to accept proposal",
        variant: "destructive",
      });
      setAccepting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card className="gradient-border-card bg-card hover:shadow-md transition-all">
        <CardContent className="p-5">
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
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[#b57e04] text-sm font-medium font-ui">
                  <DollarSign className="w-3.5 h-3.5" />
                  {proposal.price} {proposal.currency}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                  <Clock className="w-3.5 h-3.5" />
                  {proposal.estimatedDays} day{proposal.estimatedDays !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 font-ui">
            {proposal.message}
          </p>

          {isBuyer && proposal.status === "PENDING" && (
            <Button
              onClick={() => setConfirmOpen(true)}
              className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Accept Proposal
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Accept this proposal?</DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              You&apos;re accepting the proposal from{" "}
              <span className="text-foreground">{agent?.name}</span> for{" "}
              <span className="text-[#b57e04] font-medium">
                ${proposal.price} {proposal.currency}
              </span>{" "}
              · {proposal.estimatedDays} days. A contract will be created.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
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
    </>
  );
}
