"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Delivery, DeliveryFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  FileText,
  Film,
  ImageIcon,
  Archive,
  FileSpreadsheet,
  File,
  Download,
  Clock,
  AlertCircle,
  Lock,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return FileText;
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return Film;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return ImageIcon;
  if (["zip", "tar", "gz", "rar"].includes(ext)) return Archive;
  if (["xlsx", "xls", "csv", "docx", "doc"].includes(ext)) return FileSpreadsheet;
  return File;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function uploadToS3(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileUploadState {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  key?: string;
  error?: string;
}

export interface DeliveryPanelProps {
  contractId: string;
  isAgent: boolean;
  delivery?: Delivery;
  escrowPaid: boolean;
  bothSigned?: boolean;
  onPay?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeliveryPanel({
  contractId,
  isAgent,
  delivery,
  escrowPaid,
  bothSigned,
  onPay,
}: DeliveryPanelProps) {
  const [description, setDescription] = useState("");
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ["deliveryFiles", contractId],
    queryFn: () => api.getDeliveryFiles(contractId),
    enabled: !!delivery,
    staleTime: 0,
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      const valid: FileUploadState[] = [];
      for (const f of selected) {
        if (f.size > MAX_FILE_SIZE) {
          toast({ title: `${f.name} exceeds 100 MB limit`, variant: "destructive" });
          continue;
        }
        if (!ALLOWED_MIME_TYPES.has(f.type)) {
          toast({ title: `${f.name} — unsupported file type`, variant: "destructive" });
          continue;
        }
        valid.push({ file: f, progress: 0, status: "pending" });
      }
      setFileStates((prev) => [...prev, ...valid]);
      e.target.value = "";
    },
    [toast],
  );

  const removeFile = useCallback((idx: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmitDelivery = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const uploadedFiles: { key: string; filename: string; size: number }[] = [];
      for (let i = 0; i < fileStates.length; i++) {
        const fs = fileStates[i];
        setFileStates((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "uploading" };
          return next;
        });
        try {
          const { uploadUrl, key } = await api.getDeliveryUploadUrl({
            contractId,
            filename: fs.file.name,
            mimeType: fs.file.type,
            fileSize: fs.file.size,
          });
          await uploadToS3(uploadUrl, fs.file, (pct) => {
            setFileStates((prev) => {
              const next = [...prev];
              next[i] = { ...next[i], progress: pct };
              return next;
            });
          });
          setFileStates((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "done", key };
            return next;
          });
          uploadedFiles.push({ key, filename: fs.file.name, size: fs.file.size });
        } catch (err) {
          setFileStates((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "error", error: (err as Error).message };
            return next;
          });
          throw new Error(`Failed to upload ${fs.file.name}`);
        }
      }
      await api.submitDelivery({ contractId, description, files: uploadedFiles });
      toast({
        title: "Delivery submitted!",
        description: "Buyer has 5 days to review before auto-approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch (err: unknown) {
      toast({
        title: "Submission failed",
        description: (err as Error).message ?? "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!delivery) return;
    setApproving(true);
    try {
      await api.approveDelivery(delivery.id);
      toast({ title: "Payment released!", description: "The agent has been paid." });
      setApproveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch {
      toast({
        title: "Payment release failed. Please contact support.",
        variant: "destructive",
      });
      setApproving(false);
    }
  };

  const handleDispute = async () => {
    if (!delivery || disputeReason.trim().length < 10) return;
    setDisputing(true);
    try {
      await api.disputeDelivery(delivery.id, disputeReason.trim());
      toast({
        title: "Dispute submitted.",
        description: "We'll review within 2 business days.",
      });
      setDisputeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch {
      toast({ title: "Failed to submit dispute", variant: "destructive" });
      setDisputing(false);
    }
  };

  // "pending" files are uploaded during submit — only block on active error/upload states
  const allFilesReady = fileStates.every(
    (f) => f.status === "pending" || f.status === "done",
  );
  const canSubmit = description.trim().length > 0 && allFilesReady && !submitting;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <Package className="w-4 h-4 text-muted-foreground" />
        <span className="text-foreground font-semibold text-sm font-ui">Delivery</span>
        {delivery && (
          <Badge
            className={`ml-auto text-xs border ${
              delivery.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                : delivery.status === "DISPUTED"
                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                  : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {delivery.status}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!delivery ? (
          /* ── No delivery yet ─────────────────────────────────── */
          isAgent && escrowPaid ? (
            <AgentUploadForm
              description={description}
              setDescription={setDescription}
              fileStates={fileStates}
              onFileChange={handleFileChange}
              onRemoveFile={removeFile}
              canSubmit={canSubmit}
              submitting={submitting}
              onSubmit={handleSubmitDelivery}
            />
          ) : isAgent ? (
            <EmptyState
              icon={<Clock className="w-7 h-7 text-muted-foreground/50" />}
              message="Waiting for buyer to fund escrow before you can submit delivery."
            />
          ) : escrowPaid ? (
            <EmptyState
              icon={<Package className="w-7 h-7 text-muted-foreground/50" />}
              message="Waiting for delivery from the agent..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-foreground font-medium text-sm font-ui mb-1">
                  Payment required
                </p>
                {bothSigned ? (
                  <p className="text-muted-foreground text-xs font-ui">
                    Secure payment into escrow to activate this contract and let the agent begin work.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs font-ui">
                    Payment cannot be made until both parties have signed the contract.
                  </p>
                )}
              </div>
              {bothSigned && onPay && (
                <Button
                  onClick={onPay}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-ui font-medium gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Pay Now
                </Button>
              )}
            </div>
          )
        ) : (
          /* ── Delivery exists ─────────────────────────────────── */
          <div className="space-y-4">
            {/* Dispute under review banner */}
            {delivery.status === "DISPUTED" && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 dark:text-red-300 font-ui">
                  Dispute under review — our team will respond within 2 business days.
                </span>
              </div>
            )}

            {/* Approved banner */}
            {delivery.status === "APPROVED" && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 rounded-lg px-4 py-2.5 text-emerald-700 dark:text-emerald-400 text-sm font-ui">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Delivery Approved — Payment Released
              </div>
            )}

            {/* Agent: awaiting review */}
            {isAgent && delivery.status === "SUBMITTED" && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300 font-ui">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Delivery submitted — awaiting buyer review
              </div>
            )}

            {/* Review deadline */}
            {delivery.reviewDeadline && delivery.status === "SUBMITTED" && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 font-ui">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Auto-approves in {timeUntil(delivery.reviewDeadline)} if no action taken
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">
                Delivery Notes
              </p>
              <p className="text-foreground text-sm leading-relaxed font-ui whitespace-pre-wrap">
                {delivery.description}
              </p>
            </div>

            {/* Files */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-ui">
                  Files{filesData?.files.length ? ` (${filesData.files.length})` : ""}
                </p>
                {filesData?.files && filesData.files.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground font-ui"
                    onClick={() => {
                      refetchFiles().then(({ data }) => {
                        data?.files.forEach((f) => window.open(f.url, "_blank"));
                      });
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download All
                  </Button>
                )}
              </div>
              {filesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-ui py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading files...
                </div>
              ) : filesData?.files && filesData.files.length > 0 ? (
                <FileList files={filesData.files} />
              ) : (
                <p className="text-muted-foreground text-sm font-ui">No files attached.</p>
              )}
            </div>

            {/* Buyer actions */}
            {!isAgent && delivery.status === "SUBMITTED" && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs font-ui">
                  Review the deliverables and approve or open a dispute.
                </p>
                <Button
                  onClick={() => setApproveOpen(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white gap-2 font-ui font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Release Payment
                </Button>
                <Button
                  onClick={() => setDisputeOpen(true)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 gap-2 font-ui"
                >
                  <XCircle className="w-4 h-4" />
                  Open Dispute
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Release Payment?</DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              By approving, the escrowed funds will be released to the agent immediately. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              className="border-border font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-ui"
            >
              {approving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Yes, Release Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Open a Dispute</DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              Describe what&apos;s wrong with the delivery. Our team reviews within 2 business
              days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-foreground font-ui text-sm">Reason for dispute</Label>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue with this delivery..."
              className="resize-none min-h-[100px] font-ui"
            />
            {disputeReason.length > 0 && disputeReason.length < 10 && (
              <p className="text-destructive text-xs font-ui">Minimum 10 characters required</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDisputeOpen(false);
                setDisputeReason("");
              }}
              className="border-border font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDispute}
              disabled={disputing || disputeReason.trim().length < 10}
              className="bg-red-600 hover:bg-red-500 text-white font-ui"
            >
              {disputing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-muted-foreground text-sm font-ui">{message}</p>
    </div>
  );
}

function AgentUploadForm({
  description,
  setDescription,
  fileStates,
  onFileChange,
  onRemoveFile,
  canSubmit,
  submitting,
  onSubmit,
}: {
  description: string;
  setDescription: (v: string) => void;
  fileStates: FileUploadState[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm font-ui">
        Complete the work and submit your delivery below.
      </p>

      <div>
        <Label className="text-foreground text-sm mb-2 block font-ui">
          Delivery Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you've delivered and any important notes..."
          className="resize-none min-h-[120px] font-ui"
        />
      </div>

      <div>
        <Label className="text-foreground text-sm mb-2 block font-ui">
          Attach Files{" "}
          <span className="text-muted-foreground font-normal">(optional, max 100 MB each)</span>
        </Label>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-[#b57e04] transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-muted-foreground text-sm font-ui">
            Click to select files
          </span>
          <input type="file" multiple className="hidden" onChange={onFileChange} />
        </label>
      </div>

      {/* File list with progress */}
      {fileStates.length > 0 && (
        <div className="space-y-2">
          {fileStates.map((fs, idx) => {
            const Icon = getFileIcon(fs.file.name);
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-3 py-2.5"
              >
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-ui truncate">{fs.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground text-xs font-ui">
                      {formatFileSize(fs.file.size)}
                    </span>
                    {fs.status === "uploading" && (
                      <>
                        <Progress value={fs.progress} className="h-1 flex-1" />
                        <span className="text-muted-foreground text-xs font-ui">
                          {fs.progress}%
                        </span>
                      </>
                    )}
                    {fs.status === "done" && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-ui flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                    {fs.status === "error" && (
                      <span className="text-destructive text-xs font-ui">
                        {fs.error ?? "Upload failed"}
                      </span>
                    )}
                  </div>
                </div>
                {fs.status !== "uploading" && (
                  <button
                    onClick={() => onRemoveFile(idx)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-muted-foreground text-xs font-ui">
        Buyer has 5 days to review before auto-approval.
      </p>

      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Package className="w-4 h-4" />
        )}
        Submit Delivery
      </Button>
    </div>
  );
}

function FileList({ files }: { files: DeliveryFile[] }) {
  return (
    <div className="space-y-2">
      {files.map((f, i) => {
        const Icon = getFileIcon(f.filename);
        return (
          <div
            key={i}
            className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-3 py-2.5"
          >
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-ui truncate">{f.filename}</p>
              <p className="text-muted-foreground text-xs font-ui">{formatFileSize(f.size)}</p>
            </div>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              download={f.filename}
              className="flex-shrink-0"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        );
      })}
    </div>
  );
}
