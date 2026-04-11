"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProposalCard } from "@/components/jobs/ProposalCard";
import { SubmitProposalModal } from "@/components/proposals/SubmitProposalModal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Calendar, DollarSign, Tag, Users, Radio, AlertCircle,
  Send, CheckCircle, Clock, Pencil, Paperclip, X, Download,
  FileText, ImageIcon, Film, Info, Loader2,
} from "lucide-react";

const STATUS_CONFIG = {
  OPEN: { label: "Open", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  IN_PROGRESS: { label: "In Progress", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
};

const ACCEPTED_ATTR = "image/*,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.txt";
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

function extIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <ImageIcon className="w-3.5 h-3.5" />;
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return <Film className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { roles } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });

  const {
    data: proposals,
    isLoading: proposalsLoading,
    isError: proposalsForbidden,
  } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => api.getProposalsForJob(id),
    enabled: !!id,
    retry: false,
  });

  const isAgentLister = roles.includes("AGENT_LISTER");
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: isAgentLister,
  });

  const isBuyer = !proposalsForbidden && proposals !== undefined;
  const myAgents = me?.agentProfiles ?? [];

  const invalidateJob = () => queryClient.invalidateQueries({ queryKey: ["job", id] });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground font-ui">Job not found or you don&apos;t have access.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui">
          Go back
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;
  const myProposalStub = !isBuyer ? job.proposals?.find((p) => p.status !== undefined) : null;
  const currentAttachments = job.attachments ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Job header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-display font-bold text-foreground leading-snug flex-1">{job.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs border ${status.class}`}>{status.label}</Badge>
            {isBuyer && job.status === "OPEN" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 font-ui text-xs h-7 px-2.5"
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-5 font-ui">{job.description}</p>

        {job.briefDetail && (
          <div className="bg-muted/50 rounded-xl p-4 mb-4 text-sm text-muted-foreground font-ui leading-relaxed">
            <p className="text-foreground font-medium text-xs uppercase tracking-wide mb-1">Extended Brief</p>
            <p>{job.briefDetail}</p>
          </div>
        )}

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

      {/* Attachments (buyer sees full manager; agent sees read-only) */}
      {isBuyer ? (
        <AttachmentsManager
          jobId={job.id}
          attachments={currentAttachments}
          onChanged={invalidateJob}
        />
      ) : currentAttachments.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <p className="text-foreground text-sm font-semibold font-ui mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-muted-foreground" /> Attachments
          </p>
          <div className="space-y-2">
            {currentAttachments.map((att) => (
              <div key={att.key} className="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground flex-shrink-0">{extIcon(att.filename)}</span>
                <span className="text-sm font-ui text-foreground flex-1 truncate">{att.filename}</span>
                <a href={att.url} download={att.filename} target="_blank" rel="noreferrer"
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-[#b57e04] transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
                <Clock className="w-3.5 h-3.5" /> Waiting for the buyer to review your proposal.
              </p>
            )}
            {myProposalStub.status === "ACCEPTED" && (
              <p className="text-muted-foreground text-xs font-ui mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Accepted! Check your active contracts to proceed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Agent view — no proposal yet */}
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
              <Send className="w-4 h-4" /> Submit Proposal
            </Button>
            {myAgents.length === 0 && (
              <p className="text-muted-foreground text-xs font-ui mt-2">You need to register an agent first.</p>
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
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          ) : !proposals || proposals.length === 0 ? (
            <Card className="gradient-border-card bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-1 font-ui">No proposals yet</p>
                <p className="text-muted-foreground text-sm font-ui">Agents will respond within hours. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} isBuyer={job.status === "OPEN"} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Job modal */}
      {isBuyer && job.status === "OPEN" && (
        <EditJobModal
          open={editOpen}
          job={job}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); invalidateJob(); }}
        />
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

// ─── Attachments manager (buyer) ─────────────────────────────────────────────
function AttachmentsManager({
  jobId,
  attachments,
  onChanged,
}: {
  jobId: string;
  attachments: { url: string; filename: string; key: string }[];
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (attachments.length + arr.length > MAX_ATTACHMENTS) {
      toast({ title: "Too many files", description: `Maximum ${MAX_ATTACHMENTS} attachments allowed`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File too large", description: `${file.name} exceeds 100 MB`, variant: "destructive" });
          continue;
        }
        const { uploadUrl, key } = await api.getJobUploadUrl({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          jobId,
        });
        await api.uploadToS3(uploadUrl, file);
        await api.addJobAttachment(jobId, key, file.name);
        onChanged();
      }
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (key: string) => {
    setRemovingKey(key);
    try {
      await api.removeJobAttachment(jobId, key);
      onChanged();
    } catch (err: unknown) {
      toast({ title: "Remove failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-foreground text-sm font-semibold font-ui flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          Attachments
          <span className="text-xs font-normal text-muted-foreground">({attachments.length}/{MAX_ATTACHMENTS})</span>
        </p>
        {attachments.length < MAX_ATTACHMENTS && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 font-ui text-xs h-7 px-2.5"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
            {uploading ? "Uploading..." : "Add File"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_ATTR}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      {attachments.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border hover:border-[#b57e04] rounded-lg px-4 py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#b57e04] transition-colors font-ui"
        >
          <Paperclip className="w-4 h-4" />
          Attach files — images, video, PDF, Word, PowerPoint
        </button>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.key} className="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-muted-foreground flex-shrink-0">{extIcon(att.filename)}</span>
              <span className="text-sm font-ui text-foreground flex-1 truncate">{att.filename}</span>
              <a href={att.url} download={att.filename} target="_blank" rel="noreferrer"
                className="flex-shrink-0 p-1 text-muted-foreground hover:text-[#b57e04] transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleRemove(att.key)}
                disabled={removingKey === att.key}
                className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove"
              >
                {removingKey === att.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          ))}
          {attachments.length < MAX_ATTACHMENTS && (
            <p className="text-xs text-muted-foreground font-ui mt-1">Up to {MAX_ATTACHMENTS} files · Max 100 MB each</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit job modal ───────────────────────────────────────────────────────────
function EditJobModal({
  open,
  job,
  onClose,
  onSaved,
}: {
  open: boolean;
  job: Awaited<ReturnType<typeof api.getJob>>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: job.title,
    description: job.description,
    budget: job.budget != null ? String(job.budget) : "",
    deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : "",
    briefDetail: job.briefDetail ?? "",
  });

  const handleSave = async () => {
    if (!form.title.trim() || form.description.length < 20) return;
    setSaving(true);
    try {
      await api.updateJob(job.id, {
        title: form.title.trim(),
        description: form.description,
        ...(form.budget && { budget: Number(form.budget) }),
        ...(form.deadline && { deadline: new Date(form.deadline).toISOString() }),
        ...(form.briefDetail && { briefDetail: form.briefDetail }),
      });
      toast({ title: "Job updated" });
      onSaved();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Job</DialogTitle>
          <DialogDescription className="sr-only">Edit job details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Category — read-only with hint */}
          <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl px-3.5 py-3">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-ui text-foreground">
                Category: <span className="font-medium capitalize">{job.category}</span>
              </p>
              <p className="text-xs text-muted-foreground font-ui mt-0.5">
                Category cannot be changed after posting. To use a different category, delete this job and post a new one.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-foreground text-sm font-medium mb-1.5 block font-ui">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="focus-visible:ring-[#b57e04] font-ui"
            />
          </div>

          <div>
            <Label className="text-foreground text-sm font-medium mb-1.5 block font-ui">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-[120px] resize-none focus-visible:ring-[#b57e04] font-ui"
            />
            <p className="text-xs text-muted-foreground font-ui mt-1">{form.description.length} chars (min 20)</p>
          </div>

          <div>
            <Label className="text-foreground text-sm font-medium mb-1.5 block font-ui">Extended brief <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.briefDetail}
              onChange={(e) => setForm((f) => ({ ...f, briefDetail: e.target.value }))}
              placeholder="More context: tone, brand colors, target audience..."
              className="min-h-[80px] resize-none focus-visible:ring-[#b57e04] font-ui text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground text-sm font-medium mb-1.5 block font-ui">Budget (USD)</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm font-medium mb-1.5 block font-ui">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
                className="focus-visible:ring-[#b57e04] font-ui"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border font-ui" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || form.description.length < 20}
              className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
