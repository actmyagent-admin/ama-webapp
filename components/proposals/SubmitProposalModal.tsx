"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, Clock, Loader2, Bot } from "lucide-react";
import { api, AgentProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SubmitProposalModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  agents: AgentProfile[];
  onSuccess?: () => void;
}

export function SubmitProposalModal({
  open,
  onClose,
  jobId,
  jobTitle,
  agents,
  onSuccess,
}: SubmitProposalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    agents[0]?.id ?? ""
  );
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !!selectedAgentId &&
    message.trim().length >= 20 &&
    Number(price) > 0 &&
    Number(estimatedDays) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.submitProposal({
        jobId,
        message: message.trim(),
        price: Number(price),
        estimatedDays: Number(estimatedDays),
        agentProfileId: selectedAgentId,
      });
      toast({ title: "Proposal submitted!", description: "The buyer will be notified.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["proposals", jobId] });
      queryClient.invalidateQueries({ queryKey: ["agent-proposals", selectedAgentId] });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Failed to submit proposal",
        description: (err as Error).message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Submit a Proposal</DialogTitle>
          <p className="text-muted-foreground text-sm font-ui mt-0.5 line-clamp-2">
            {jobTitle}
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Agent selection */}
          {agents.length > 1 && (
            <div>
              <Label className="font-ui text-sm font-medium mb-2 block">
                Submit as
              </Label>
              <div className="space-y-2">
                {agents.map((agent) => {
                  const initials = agent.name.slice(0, 2).toUpperCase();
                  const selected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all font-ui ${
                        selected
                          ? "border-[#b57e04] bg-[#b57e04]/5"
                          : "border-border hover:border-[#b57e04]/50 bg-card"
                      }`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {agent.mainPic ? (
                          <img src={agent.mainPic} alt={agent.name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">
                          {agent.name}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {agent.categories.map((c) => c.name).join(", ")}
                        </p>
                      </div>
                      {selected && (
                        <div className="w-4 h-4 rounded-full bg-[#b57e04] flex items-center justify-center flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {agents.length === 1 && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/40">
              <Avatar className="w-8 h-8 flex-shrink-0">
                {agents[0].mainPic ? (
                  <img src={agents[0].mainPic} alt={agents[0].name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xs font-semibold">
                    {agents[0].name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium font-ui truncate">
                  {agents[0].name}
                </p>
                <p className="text-muted-foreground text-xs font-ui">Submitting as this agent</p>
              </div>
            </div>
          )}

          {agents.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground">
              <Bot className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-ui">You have no registered agents. Register one first.</p>
            </div>
          )}

          {/* Proposal message */}
          <div>
            <Label className="font-ui text-sm font-medium mb-1.5 block">
              Your Pitch
            </Label>
            <Textarea
              placeholder="Describe how you'll approach this task, your relevant experience, and any clarifying questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none min-h-[120px] focus-visible:ring-[#b57e04] font-ui text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1 font-ui">
              Minimum 20 characters. {message.length} / 20 min
            </p>
          </div>

          {/* Price + Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-ui text-sm font-medium mb-1.5 block">
                Price (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  placeholder="150"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-8 focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
            </div>
            <div>
              <Label className="font-ui text-sm font-medium mb-1.5 block">
                Delivery (days)
              </Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  placeholder="3"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className="pl-8 focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 border-border font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting || agents.length === 0}
              className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
