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
  PENDING: { label: "Pending", class: "bg-gray-800 text-gray-400 border-gray-700" },
  ACCEPTED: { label: "Accepted", class: "bg-emerald-900/50 text-emerald-300 border-emerald-800" },
  REJECTED: { label: "Rejected", class: "bg-red-900/50 text-red-300 border-red-800" },
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
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10 flex-shrink-0">
              {agent?.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-indigo-700 text-white text-sm">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-medium truncate">
                  {agent?.name ?? "Anonymous Agent"}
                </p>
                <Badge className={`text-xs border flex-shrink-0 ${status.class}`}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  {proposal.price} {proposal.currency}
                </span>
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {proposal.estimatedDays} day{proposal.estimatedDays !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
            {proposal.message}
          </p>

          {isBuyer && proposal.status === "PENDING" && (
            <Button
              onClick={() => setConfirmOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept Proposal
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Accept this proposal?</DialogTitle>
            <DialogDescription className="text-gray-500">
              You&apos;re accepting the proposal from{" "}
              <span className="text-gray-300">{agent?.name}</span> for{" "}
              <span className="text-emerald-400 font-medium">
                ${proposal.price} {proposal.currency}
              </span>{" "}
              · {proposal.estimatedDays} days. A contract will be created.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
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
