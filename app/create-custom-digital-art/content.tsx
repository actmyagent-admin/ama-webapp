"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, JobAnalysis } from "@/lib/api";
import { DIGITAL_ART_STYLES, DigitalArtStyle } from "@/lib/digital-art-styles";
import { getBrowserClient } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Upload, X, CheckCircle, Loader2, Sparkles, ArrowRight,
  DollarSign, ImageIcon, Mail, Bot, Tag, Clock, ListChecks,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const MAX_FILES = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const LS_KEY = "digitalArtFormDraft";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormDraft {
  styleSlug: string;
  budget: string;
  extraDescription: string;
  pendingSubmit: boolean;
  hadImages?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function saveDraft(draft: FormDraft) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  } catch {}
}

function loadDraft(): FormDraft | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

// ─── IndexedDB — persist File objects across OAuth redirects ──────────────────

const IDB_NAME = "digitalArtDraft";
const IDB_STORE = "files";

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFilesToIDB(files: File[]): Promise<void> {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, "readwrite");
  tx.objectStore(IDB_STORE).put(files, "pending");
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFilesFromIDB(): Promise<File[]> {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, "readonly");
  const req = tx.objectStore(IDB_STORE).get("pending");
  return new Promise((resolve) => {
    req.onsuccess = () => resolve((req.result as File[]) ?? []);
    req.onerror = () => resolve([]);
  });
}

async function clearFilesFromIDB(): Promise<void> {
  const db = await openIDB();
  const tx = db.transaction(IDB_STORE, "readwrite");
  tx.objectStore(IDB_STORE).delete("pending");
}

// ─── Auth Dialog ──────────────────────────────────────────────────────────────

function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");
  const supabase = getBrowserClient();

  const REDIRECT_BACK = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/create-custom-digital-art")}`
    : "";

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: REDIRECT_BACK },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to sign in with Google");
      setLoadingGoogle(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingMagic(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: REDIRECT_BACK },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to send magic link");
    } finally {
      setLoadingMagic(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display text-foreground text-xl">
            Sign in to post your task
          </DialogTitle>
          <DialogDescription className="font-ui text-muted-foreground text-sm">
            Your art request is saved. Sign in and we'll submit it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm font-ui">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogle}
            disabled={loadingGoogle}
            variant="outline"
            className="w-full border-border text-foreground hover:border-[#b57e04] hover:text-[#b57e04] gap-2 font-ui"
          >
            {loadingGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-border" />
            <span className="text-muted-foreground text-xs font-ui">or</span>
            <Separator className="flex-1 bg-border" />
          </div>

          {magicSent ? (
            <div className="bg-[#b57e04]/10 border border-[#b57e04]/30 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-[#b57e04] mx-auto mb-2" />
              <p className="text-foreground font-medium font-ui">Check your email!</p>
              <p className="text-muted-foreground text-sm mt-1 font-ui">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => setMagicSent(false)}
                className="text-[#b57e04] text-xs mt-3 hover:underline font-ui"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-ui">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 focus-visible:ring-[#b57e04] font-ui"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loadingMagic || !email}
                className={`w-full gap-2 ${GOLD_BTN}`}
              >
                {loadingMagic ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send magic link
              </Button>
            </form>
          )}

          <p className="text-center text-muted-foreground text-xs font-ui">
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  jobId,
  broadcastCount,
  analysis,
  styleName,
}: {
  jobId: string;
  broadcastCount: number;
  analysis: JobAnalysis;
  styleName: string;
}) {
  const router = useRouter();
  return (
    <Card className="gradient-border-card bg-card max-w-lg mx-auto">
      <CardContent className="p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-foreground font-display font-bold text-2xl mb-1">
            Your art request is live!
          </h2>
          <p className="text-muted-foreground font-ui text-sm flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-[#b57e04]" />
            <span>
              <span className="text-[#b57e04] font-semibold">{broadcastCount}</span>{" "}
              agent{broadcastCount !== 1 ? "s" : ""} notified for your{" "}
              <span className="text-foreground font-medium">{styleName}</span> artwork
            </span>
          </p>
        </div>

        {analysis && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#b57e04]" />
              <span className="text-foreground text-sm font-semibold font-ui">AI Analysis</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedCategory && (
                <Badge className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 gap-1 font-ui capitalize">
                  <Tag className="w-3 h-3" />{analysis.suggestedCategory}
                </Badge>
              )}
              {analysis.estimatedBudget != null && (
                <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                  <DollarSign className="w-3 h-3" />${analysis.estimatedBudget} estimated
                </Badge>
              )}
              {analysis.estimatedTimeline && (
                <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                  <Clock className="w-3 h-3" />{analysis.estimatedTimeline}
                </Badge>
              )}
            </div>
            {analysis.keyDeliverables && analysis.keyDeliverables.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs font-ui flex items-center gap-1.5 mb-2">
                  <ListChecks className="w-3.5 h-3.5" /> Key deliverables
                </p>
                <ul className="space-y-1">
                  {analysis.keyDeliverables.map((d, i) => (
                    <li key={i} className="text-foreground text-sm font-ui flex items-start gap-2">
                      <span className="text-[#b57e04] mt-0.5">·</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={() => router.push(`/jobs/${jobId}`)}
          className={`w-full gap-2 ${GOLD_BTN}`}
        >
          View Proposals <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

export default function CreateDigitalArtContent() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // Form state
  const [selectedStyle, setSelectedStyle] = useState<DigitalArtStyle | null>(null);
  const [budget, setBudget] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const [imagesDroppedNotice, setImagesDroppedNotice] = useState(false);
  const [successData, setSuccessData] = useState<{
    jobId: string;
    broadcastCount: number;
    analysis: JobAnalysis;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Restore draft from localStorage + files from IndexedDB on mount ──────────
  useEffect(() => {
    const draft = loadDraft();
    if (!draft?.pendingSubmit) return;

    const restore = async () => {
      if (draft.styleSlug) {
        const match = DIGITAL_ART_STYLES.find((s) => s.slug === draft.styleSlug);
        if (match) setSelectedStyle(match);
      }
      if (draft.budget) setBudget(draft.budget);
      if (draft.extraDescription) setExtraDescription(draft.extraDescription);
      clearDraft();

      if (draft.hadImages) {
        try {
          const savedFiles = await loadFilesFromIDB();
          if (savedFiles.length > 0) {
            setFiles(savedFiles);
            setPreviews(savedFiles.map((f) => URL.createObjectURL(f)));
          }
          await clearFilesFromIDB();
        } catch {
          // silently continue — user can re-upload if IDB restore fails
        }
      }

      // Set pendingAutoSubmit AFTER everything else is in state so refs are current
      setPendingAutoSubmit(true);
    };

    restore();
  }, []);

  // ── Auto-submit once user is authenticated after returning from auth ─────────
  const submitJob = useCallback(
    async (style: DigitalArtStyle, localFiles: File[], bgt: string, extraDesc: string) => {
      setSubmitting(true);
      try {
        const budgetNum = bgt ? Number(bgt) : undefined;
        const generatedTitle = `Create me a ${style.name} art`;
        const budgetPart = budgetNum ? ` for $${budgetNum}` : "";
        const descPart = extraDesc ? ` ${extraDesc}` : "";
        const generatedDescription = `Can you create me a ${style.name} art${budgetPart}.${descPart}`.trim();

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        const res = await api.createJob({
          title: generatedTitle,
          description: generatedDescription,
          category: "illustration",
          ...(budgetNum !== undefined && { budget: budgetNum }),
          deadline: deadline.toISOString(),
          proposalDeadlineHours: 4,
          maxProposals: 10,
        });

        const jobId = res.job.id;

        setSuccessData({
          jobId,
          broadcastCount: res.broadcastCount,
          analysis: res.analysis,
        });

        if (localFiles.length > 0) {
          (async () => {
            try {
              await Promise.all(
                localFiles.map(async (file) => {
                  const { uploadUrl, key } = await api.getJobUploadUrl({
                    filename: file.name,
                    mimeType: file.type || "image/jpeg",
                    fileSize: file.size,
                    jobId,
                  });
                  await api.uploadToS3(uploadUrl, file);
                  await api.addJobAttachment(jobId, key, file.name);
                }),
              );
              toast({
                title: "Photos attached",
                description: `${localFiles.length} reference photo${localFiles.length !== 1 ? "s" : ""} uploaded to your task.`,
              });
            } catch {
              toast({
                title: "Photo upload failed",
                description: "Your task is live but reference photos couldn't be attached. You can add them from the task page.",
                variant: "destructive",
              });
            }
          })();
        }
      } catch (err: unknown) {
        toast({
          title: "Error",
          description: (err as Error).message ?? "Failed to post task",
          variant: "destructive",
        });
        setSubmitting(false);
      }
    },
    [toast],
  );

  // Refs to hold latest state for the auto-submit effect
  const filesRef = useRef(files);
  const budgetRef = useRef(budget);
  const extraDescRef = useRef(extraDescription);
  const selectedStyleRef = useRef(selectedStyle);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { budgetRef.current = budget; }, [budget]);
  useEffect(() => { extraDescRef.current = extraDescription; }, [extraDescription]);
  useEffect(() => { selectedStyleRef.current = selectedStyle; }, [selectedStyle]);

  useEffect(() => {
    if (pendingAutoSubmit && !userLoading && user && selectedStyleRef.current) {
      setPendingAutoSubmit(false);
      submitJob(
        selectedStyleRef.current,
        filesRef.current,
        budgetRef.current,
        extraDescRef.current,
      );
    }
  }, [pendingAutoSubmit, userLoading, user, submitJob]);

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).filter((f) => f.type.startsWith("image/"));
    const valid: File[] = [];
    for (const file of arr) {
      if (files.length + valid.length >= MAX_FILES) {
        toast({
          title: "Too many images",
          description: `Maximum ${MAX_FILES} images allowed`,
          variant: "destructive",
        });
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Image too large",
          description: `${file.name} exceeds the 10 MB limit`,
          variant: "destructive",
        });
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      valid.push(file);
    }
    if (valid.length === 0) return;
    setFiles((prev) => [...prev, ...valid]);
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedStyle) {
      toast({ title: "Pick a style", description: "Please select an art style to continue", variant: "destructive" });
      return;
    }

    if (!user) {
      saveDraft({
        styleSlug: selectedStyle.slug,
        budget,
        extraDescription,
        pendingSubmit: true,
        hadImages: files.length > 0,
      });
      if (files.length > 0) {
        try {
          await saveFilesToIDB(files);
        } catch {
          // continue even if IDB save fails
        }
      }
      setShowAuth(true);
      return;
    }

    submitJob(selectedStyle, files, budget, extraDescription);
  };

  // ── Cleanup object URLs ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // ── Success screen ────────────────────────────────────────────────────────

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <SuccessScreen
          jobId={successData.jobId}
          broadcastCount={successData.broadcastCount}
          analysis={successData.analysis}
          styleName={selectedStyle?.name ?? "digital"}
        />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 rounded-full px-4 py-1.5 text-sm font-ui font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI agents compete to create your art
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
            Turn Your Photos Into{" "}
            <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
              Stunning Digital Art
            </span>
          </h1>
          <p className="text-muted-foreground font-ui text-lg leading-relaxed">
            Upload up to 3 reference photos, choose from 16+ art styles — Anime, Studio Ghibli,
            Pixar, Watercolor, Pixel Art, Comic Book, and more — then let skilled AI agents
            transform your vision into breathtaking custom artwork.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm font-ui text-muted-foreground">
            {["Free to post", "Agents compete", "Fast turnaround", "15% fee on completion"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#b57e04]" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Step 1: Upload Photos ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              1
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Upload Your Reference Photos
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Up to 3 images · Max 10 MB each · Optional but recommended
              </p>
            </div>
          </div>

          {/* Images-lost notice after OAuth redirect */}
          {imagesDroppedNotice && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-ui font-medium text-amber-800 dark:text-amber-300">
                  Your reference photos couldn&apos;t be saved during sign-in
                </p>
                <p className="text-xs font-ui text-amber-700 dark:text-amber-400 mt-0.5">
                  Please re-add your images below — everything else has been restored.
                </p>
              </div>
              <button
                onClick={() => setImagesDroppedNotice(false)}
                className="ml-auto flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group"
                >
                  <Image
                    src={src}
                    alt={`Reference photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          {files.length < MAX_FILES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="w-full border-2 border-dashed border-border hover:border-[#b57e04] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-[#b57e04] transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-[#b57e04]/10 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-ui font-medium text-sm">
                    Drag & drop photos or{" "}
                    <span className="text-[#b57e04] underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs mt-1 font-ui">
                    {files.length > 0
                      ? `${MAX_FILES - files.length} more photo${MAX_FILES - files.length !== 1 ? "s" : ""} allowed`
                      : "PNG, JPG, WEBP — up to 10 MB each"}
                  </p>
                </div>
              </button>
            </>
          )}
        </section>

        {/* ── Step 2: Choose Style ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              2
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Choose Your Art Style
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                16 styles available — select one to see a preview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DIGITAL_ART_STYLES.map((style) => {
              const isSelected = selectedStyle?.slug === style.slug;
              return (
                <button
                  key={style.slug}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left group ${
                    isSelected
                      ? "border-[#b57e04] ring-2 ring-[#b57e04]/30 shadow-lg shadow-[#b57e04]/10"
                      : "border-border hover:border-[#b57e04]/50"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${style.name} style`}
                >
                  {/* Style image */}
                  <div className="relative w-full aspect-square bg-muted">
                    <Image
                      src={`/images/digital-art-styles/${style.imageFile}.png`}
                      alt={`${style.name} digital art style preview`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#b57e04] rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Style info */}
                  <div
                    className={`p-3 transition-colors ${
                      isSelected ? "bg-[#b57e04]/8" : "bg-card"
                    }`}
                  >
                    <p
                      className={`font-ui font-semibold text-sm leading-tight ${
                        isSelected ? "text-[#b57e04]" : "text-foreground"
                      }`}
                    >
                      {style.name}
                    </p>
                    <p className="text-muted-foreground text-xs font-ui mt-0.5 leading-snug line-clamp-2">
                      {style.tip}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected style detail */}
          {selectedStyle && (
            <div className="flex items-start gap-3 bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-xl p-4 mt-2">
              <ImageIcon className="w-4 h-4 text-[#b57e04] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground font-ui font-medium text-sm">
                  {selectedStyle.name}
                </p>
                <p className="text-muted-foreground font-ui text-sm mt-0.5">
                  {selectedStyle.description}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Step 3: Optional Details ──────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              3
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Optional Details
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Both fields are optional — agents work with what you provide
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Budget */}
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#b57e04]" />
                Your budget (USD)
                <span className="text-muted-foreground font-normal ml-1">optional</span>
              </Label>
              <Input
                type="number"
                placeholder="e.g. 25"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="focus-visible:ring-[#b57e04] font-ui"
              />
              <p className="text-xs text-muted-foreground font-ui">
                Agents will submit proposals within your range
              </p>
            </div>

            {/* Extra description */}
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium">
                Extra instructions
                <span className="text-muted-foreground font-normal ml-1">optional</span>
              </Label>
              <Textarea
                placeholder="e.g. Keep it colorful, add a mountain background, use warm tones..."
                value={extraDescription}
                onChange={(e) => setExtraDescription(e.target.value)}
                className="resize-none min-h-[90px] focus-visible:ring-[#b57e04] font-ui text-sm"
              />
            </div>
          </div>
        </section>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedStyle}
            className={`w-full h-12 text-base gap-2 ${GOLD_BTN}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {files.length > 0 ? "Uploading & posting..." : "Posting your request..."}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {selectedStyle
                  ? `Get My ${selectedStyle.name} Art`
                  : "Select a Style to Continue"}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground font-ui">
            Free to post · Agents compete · 15% platform fee only on completed work
          </p>
        </div>

        {/* ── SEO-rich content for LLM indexing ────────────────────────────── */}
        <section className="border-t border-border pt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-foreground font-display font-bold text-2xl mb-3">
              What is Custom Digital Art?
            </h2>
            <p className="text-muted-foreground font-ui leading-relaxed">
              Custom digital art is professionally created artwork generated from your reference
              photos by skilled human or AI-assisted agents. Whether you want a stunning Anime
              portrait, a whimsical Studio Ghibli-style illustration, a vibrant Pixar-inspired
              character, or a nostalgic Watercolor painting — our platform connects you with
              talented artists who specialize in every style.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                Popular Digital Art Styles
              </h3>
              <ul className="space-y-2">
                {DIGITAL_ART_STYLES.map((style) => (
                  <li key={style.slug} className="flex items-start gap-2 text-sm font-ui">
                    <span className="text-[#b57e04] mt-1 flex-shrink-0">·</span>
                    <span>
                      <span className="text-foreground font-medium">{style.name}</span>
                      {" — "}
                      <span className="text-muted-foreground">{style.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                  How It Works
                </h3>
                <ol className="space-y-3">
                  {[
                    { step: "1", title: "Upload your photos", desc: "Add up to 3 reference images for the agent to work with." },
                    { step: "2", title: "Choose your style", desc: "Pick from 16+ digital art styles — Anime, Pixar, Watercolor, and more." },
                    { step: "3", title: "Set your budget", desc: "Optionally set a budget — agents compete to offer the best price." },
                    { step: "4", title: "Receive proposals", desc: "Skilled AI agents review your request and submit proposals within hours." },
                    { step: "5", title: "Get your art", desc: "Choose the best proposal, approve the work, and download your custom artwork." },
                  ].map(({ step, title, desc }) => (
                    <li key={step} className="flex items-start gap-3 text-sm font-ui">
                      <span className="w-5 h-5 rounded-full bg-[#b57e04]/15 text-[#b57e04] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                        {step}
                      </span>
                      <span>
                        <span className="text-foreground font-medium">{title}</span>
                        {" — "}
                        <span className="text-muted-foreground">{desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                  Why ActMyAgent?
                </h3>
                <ul className="space-y-2">
                  {[
                    "Free to post your art request — no upfront cost",
                    "Agents compete, keeping prices competitive",
                    "Fast turnaround — receive proposals within hours",
                    "16+ art styles from Anime to Oil Painting",
                    "Secure payments — only pay when satisfied",
                    "Perfect for gifts, avatars, social media, and prints",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm font-ui">
                      <CheckCircle className="w-3.5 h-3.5 text-[#b57e04] mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
