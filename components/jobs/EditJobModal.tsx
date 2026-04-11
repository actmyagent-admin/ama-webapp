"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Job } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditJobModalProps {
  job: Job | null;
  onClose: () => void;
}

export function EditJobModal({ job, onClose }: EditJobModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deadline, setDeadline] = useState("");
  const [preferHuman, setPreferHuman] = useState(false);
  const [proposalDeadlineHours, setProposalDeadlineHours] = useState("");
  const [maxProposals, setMaxProposals] = useState("");

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDescription(job.description);
      setBudget(String(job.budget ?? job.budgetMax ?? ""));
      setCurrency(job.currency ?? "USD");
      // Format deadline as YYYY-MM-DD for the date input
      const d = job.deadline ? new Date(job.deadline) : null;
      setDeadline(d ? d.toISOString().split("T")[0] : "");
      setPreferHuman(job.preferHuman ?? false);
      setProposalDeadlineHours("");
      setMaxProposals("");
    }
  }, [job]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      if (!job) throw new Error("No job");
      const body: Parameters<typeof api.updateJob>[1] = {};
      if (title !== job.title) body.title = title;
      if (description !== job.description) body.description = description;
      const budgetNum = budget ? Number(budget) : undefined;
      if (budgetNum != null && budgetNum !== (job.budget ?? job.budgetMax)) body.budget = budgetNum;
      if (currency !== job.currency) body.currency = currency;
      const dl = deadline ? new Date(deadline).toISOString() : undefined;
      if (dl && dl !== job.deadline) body.deadline = dl;
      if (preferHuman !== (job.preferHuman ?? false)) body.preferHuman = preferHuman;
      if (proposalDeadlineHours) body.proposalDeadlineHours = Number(proposalDeadlineHours);
      if (maxProposals !== "") body.maxProposals = Number(maxProposals) || null as unknown as number;
      return api.updateJob(job.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      onClose();
    },
  });

  const errorMsg =
    error instanceof Error ? error.message : error ? "Failed to update job" : null;

  return (
    <Dialog open={!!job} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Category — read-only */}
          {job && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground font-ui">Category (cannot be changed)</Label>
              <div className="px-3 py-2 rounded-md border border-border bg-muted text-muted-foreground text-sm font-ui capitalize">
                {job.category}
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="edit-title" className="font-ui text-sm">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-ui text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-description" className="font-ui text-sm">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="font-ui text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-budget" className="font-ui text-sm">Budget</Label>
              <Input
                id="edit-budget"
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="font-ui text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-currency" className="font-ui text-sm">Currency</Label>
              <Input
                id="edit-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className="font-ui text-sm"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-deadline" className="font-ui text-sm">Deadline</Label>
            <Input
              id="edit-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="font-ui text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-proposal-deadline" className="font-ui text-sm">
                Proposal deadline (hours)
              </Label>
              <Input
                id="edit-proposal-deadline"
                type="number"
                min={1}
                placeholder="e.g. 72"
                value={proposalDeadlineHours}
                onChange={(e) => setProposalDeadlineHours(e.target.value)}
                className="font-ui text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-max-proposals" className="font-ui text-sm">
                Max proposals
              </Label>
              <Input
                id="edit-max-proposals"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={maxProposals}
                onChange={(e) => setMaxProposals(e.target.value)}
                className="font-ui text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-prefer-human"
              type="checkbox"
              checked={preferHuman}
              onChange={(e) => setPreferHuman(e.target.checked)}
              className="w-4 h-4 accent-[#b57e04]"
            />
            <Label htmlFor="edit-prefer-human" className="font-ui text-sm cursor-pointer">
              Prefer human agent
            </Label>
          </div>

          {errorMsg && (
            <p className="text-red-600 dark:text-red-400 text-xs font-ui">{errorMsg}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="font-ui text-sm" disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !title.trim() || !description.trim()}
            className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui text-sm"
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
