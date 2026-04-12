"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api, AgentProfile, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  X,
  ArrowLeft,
  Paperclip,
  FileText,
  ImageIcon,
  Film,
  Loader2,
  ClipboardList,
  Send,
  Radio,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const ACCEPTED_ATTR =
  "image/*,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.txt";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILES = 5;

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
  if (type.startsWith("video/")) return <Film className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  agent: AgentProfile;
  open: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  desiredDeliveryDays: string;
  broadcastOnDecline: boolean;
}

export function DirectRequestDrawer({ agent, open, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseWindow = Math.max(agent.responseTimeSlaHours ?? 12, 4);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    desiredDeliveryDays: "",
    broadcastOnDecline: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { mutate: postToAllAgents, isPending: isPostingAll } = useMutation({
    mutationFn: () =>
      api.createJob({
        title: form.title,
        description: form.description,
        category: agent.categories[0]?.slug ?? "",
        ...(form.budgetMax && { budget: Number(form.budgetMax) }),
        ...(form.desiredDeliveryDays && {
          desiredDeliveryDays: Number(form.desiredDeliveryDays),
        }),
      }),
    onSuccess: (res) => {
      toast({
        title: "Task posted to all agents!",
        description: `${agent.categories[0]?.name ?? "Similar"} agents have been notified.`,
      });
      onClose();
      router.push(`/jobs/${res.job.id}`);
    },
    onError: (err: Error) => {
      setInlineError(err.message ?? "Failed to post task");
    },
  });

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected);
    const valid: File[] = [];
    for (const file of arr) {
      if (files.length + valid.length >= MAX_FILES) {
        toast({
          title: "Too many files",
          description: `Maximum ${MAX_FILES} files allowed`,
          variant: "destructive",
        });
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 100 MB limit`,
          variant: "destructive",
        });
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size))
        continue;
      valid.push(file);
    }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setInlineError(null);
    setCapacityError(false);

    if (!form.title.trim()) {
      setInlineError("Task title is required.");
      return;
    }
    if (form.description.trim().length < 10) {
      setInlineError("Please describe your task (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const attachmentKeys: string[] = [];
      for (const file of files) {
        const { uploadUrl, key } = await api.getJobUploadUrl({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
        await api.uploadToS3(uploadUrl, file);
        attachmentKeys.push(key);
      }

      const avgBudget =
        form.budgetMin && form.budgetMax
          ? (Number(form.budgetMin) + Number(form.budgetMax)) / 2
          : form.budgetMax
          ? Number(form.budgetMax)
          : form.budgetMin
          ? Number(form.budgetMin)
          : undefined;

      const res = await api.createDirectRequest({
        agentProfileId: agent.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: agent.categories[0]?.slug ?? "",
        ...(avgBudget != null && { budget: avgBudget }),
        ...(form.desiredDeliveryDays && {
          desiredDeliveryDays: Number(form.desiredDeliveryDays),
        }),
        broadcastOnDecline: form.broadcastOnDecline,
        ...(attachmentKeys.length > 0 && { attachmentKeys }),
      });

      const hoursRemaining = res.expiresAt
        ? Math.max(
            0,
            Math.round(
              (new Date(res.expiresAt).getTime() - Date.now()) / 3600000
            )
          )
        : responseWindow;

      toast({
        title: `Request sent to ${agent.name}!`,
        description: `They have ${hoursRemaining}h to respond.`,
      });
      onClose();
      router.push("/dashboard/buyer");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (
        apiErr?.status === 409 ||
        (apiErr?.data as { code?: string })?.code === "AGENT_AT_CAPACITY"
      ) {
        setCapacityError(true);
        setInlineError(null);
      } else {
        setInlineError(
          (err as Error).message ?? "Failed to send request. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initials = agent.name.slice(0, 2).toUpperCase();
  const canSubmit =
    form.title.trim().length > 0 && form.description.trim().length >= 10;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Request ${agent.name}`}
        className={`fixed right-0 top-0 h-full w-full sm:max-w-lg bg-background border-l border-border z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
            aria-label="Close"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-8 h-8 flex-shrink-0">
            {agent.mainPic || agent.avatarUrl ? (
              <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agent.name} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-ui">Request from</p>
            <p className="text-sm font-semibold text-foreground font-ui truncate">
              {agent.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info bar */}
        <div className="px-5 py-2.5 bg-[#b57e04]/8 border-b border-[#b57e04]/20 flex-shrink-0">
          <p className="text-[#b57e04] text-xs font-ui">
            Direct requests get a dedicated response within{" "}
            <span className="font-semibold">{responseWindow}h</span>. The agent
            can accept or decline your request.
          </p>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Title */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
              Task title <span className="text-red-500">*</span>
            </Label>
            <Input
              autoFocus
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              maxLength={100}
              placeholder='Summarise as: "Edit my product demo video"'
              className="focus-visible:ring-[#b57e04] font-ui"
            />
            <p className="text-muted-foreground text-xs font-ui mt-1">
              {form.title.length}/100
            </p>
          </div>

          {/* Description */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
              Describe your task <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={4}
              placeholder="Include details like: what you need, style preferences, what files you'll provide..."
              className="resize-none focus-visible:ring-[#b57e04] font-ui"
            />
            {agent.inputRequirements && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2.5">
                <ClipboardList className="w-4 h-4 text-[#b57e04] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground font-ui mb-0.5">
                    This agent needs:
                  </p>
                  <p className="text-xs text-muted-foreground font-ui">
                    {agent.inputRequirements}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
              Your budget{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={form.budgetMin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budgetMin: e.target.value }))
                  }
                  className="pl-6 focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={form.budgetMax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budgetMax: e.target.value }))
                  }
                  className="pl-6 focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-ui mt-1.5">
              Agent&apos;s typical range: ${agent.priceFrom}–${agent.priceTo}{" "}
              {agent.currency ?? "USD"}
            </p>
          </div>

          {/* Delivery */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
              Preferred delivery{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={form.desiredDeliveryDays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    desiredDeliveryDays: e.target.value,
                  }))
                }
                className="w-28 focus-visible:ring-[#b57e04] font-ui"
              />
              <span className="text-sm text-muted-foreground font-ui">
                days
              </span>
            </div>
            {agent.deliveryDays != null && (
              <p className="text-muted-foreground text-xs font-ui mt-1.5">
                Agent&apos;s standard turnaround:{" "}
                <span className="text-foreground">{agent.deliveryDays} days</span>
                {agent.expressDeliveryDays != null && (
                  <>
                    {" "}
                    · Express (
                    <span className="text-foreground">
                      {agent.expressDeliveryDays} days
                    </span>
                    ) available
                  </>
                )}
              </p>
            )}
          </div>

          {/* File attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-foreground text-sm font-medium font-ui">
                Attachments{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <span className="text-xs text-muted-foreground font-ui">
                {files.length}/{MAX_FILES}
              </span>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mb-3">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-muted-foreground flex-shrink-0">
                      {getFileIcon(file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-ui text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length < MAX_FILES && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_ATTR}
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-[#b57e04] rounded-lg px-4 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#b57e04] transition-colors font-ui"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach files — images, video, PDF, Word, PowerPoint
                </button>
                <p className="text-xs text-muted-foreground font-ui mt-1.5">
                  Up to {MAX_FILES} files · Max 100 MB each
                </p>
              </>
            )}
          </div>

          {/* Broadcast option */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.broadcastOnDecline}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    broadcastOnDecline: e.target.checked,
                  }))
                }
                className="w-4 h-4 mt-0.5 rounded border-border accent-[#b57e04] cursor-pointer flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-foreground font-ui flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#b57e04]" />
                  Also notify similar agents
                </p>
                <p className="text-xs text-muted-foreground font-ui mt-1 leading-relaxed">
                  If {agent.name} doesn&apos;t respond within {responseWindow}h,
                  your task will automatically be shared with other agents in
                  the{" "}
                  <span className="capitalize text-foreground">
                    {agent.categories[0]?.name ?? "same"}
                  </span>{" "}
                  category.
                </p>
              </div>
            </label>
          </div>

          {/* Inline error */}
          {inlineError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
              <p className="text-destructive text-sm font-ui">{inlineError}</p>
            </div>
          )}

          {/* Capacity error */}
          {capacityError && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 px-4 py-4 space-y-3">
              <p className="text-amber-800 dark:text-amber-200 text-sm font-ui font-semibold">
                This agent just reached capacity.
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs font-ui">
                Would you like to post this to all{" "}
                <span className="capitalize font-medium">
                  {agent.categories[0]?.name ?? "similar"}
                </span>{" "}
                agents instead?
              </p>
              <Button
                size="sm"
                onClick={() => postToAllAgents()}
                disabled={isPostingAll}
                className={`gap-2 ${GOLD_BTN}`}
              >
                {isPostingAll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Post to All Agents
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-border text-foreground hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className={`flex-1 gap-2 ${GOLD_BTN}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Request
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
