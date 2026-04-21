"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api, InhouseService } from "@/lib/api";
import { DIGITAL_ART_STYLES, DigitalArtStyle } from "@/lib/digital-art-styles";
import { getBrowserClient } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Upload, X, CheckCircle, Loader2, Sparkles, ArrowRight,
  ImageIcon, Mail, Clock, RefreshCw, Layers, ShieldCheck,
  CreditCard,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const LS_KEY = "digitalArtFormDraft";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormDraft {
  serviceId: string;
  styleSlug: string;
  description: string;
  pendingSubmit: boolean;
  hadImages?: boolean;
}

// ─── Draft helpers ────────────────────────────────────────────────────────────

function saveDraft(draft: FormDraft) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(draft)); } catch {}
}
function loadDraft(): FormDraft | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as FormDraft) : null;
  } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(LS_KEY); } catch {}
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

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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
            Sign in to place your order
          </DialogTitle>
          <DialogDescription className="font-ui text-muted-foreground text-sm">
            Your order details are saved. Sign in and we&apos;ll submit automatically.
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
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm font-ui focus:outline-none focus:ring-2 focus:ring-[#b57e04]"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loadingMagic || !email}
                className={`w-full gap-2 ${GOLD_BTN}`}
              >
                {loadingMagic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
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

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({
  service,
  selected,
  onSelect,
}: {
  service: InhouseService;
  selected: boolean;
  onSelect: () => void;
}) {
  const price = `$${(service.priceCents / 100).toFixed(0)}`;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-2xl border-2 p-5 text-left transition-all w-full ${
        selected
          ? "border-[#b57e04] ring-2 ring-[#b57e04]/30 bg-[#b57e04]/5 dark:bg-[#b57e04]/10"
          : "border-border hover:border-[#b57e04]/50 bg-card"
      }`}
      aria-pressed={selected}
    >
      {service.isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className={`${GOLD_BTN} text-xs px-3 py-0.5 border-0`}>
            Most Popular
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-display font-bold text-lg leading-tight ${selected ? "text-[#b57e04]" : "text-foreground"}`}>
              {service.packageName}
            </p>
            <p className="text-muted-foreground text-xs font-ui mt-0.5">{service.tagline}</p>
          </div>
          {selected && (
            <div className="w-5 h-5 bg-[#b57e04] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-display font-bold ${selected ? "text-[#b57e04]" : "text-foreground"}`}>
            {price}
          </span>
          <span className="text-muted-foreground text-sm font-ui">USD</span>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs font-ui text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
            {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""} delivery
          </div>
          <div className="flex items-center gap-2 text-xs font-ui text-muted-foreground">
            <RefreshCw className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
            {service.revisionsIncluded} revision{service.revisionsIncluded !== 1 ? "s" : ""} included
          </div>
          {service.deliveryVariants > 1 && (
            <div className="flex items-center gap-2 text-xs font-ui text-muted-foreground">
              <Layers className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
              {service.deliveryVariants} variants
            </div>
          )}
        </div>

        <ul className="space-y-1">
          {service.whatsIncluded.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs font-ui">
              <CheckCircle className="w-3 h-3 text-[#b57e04] flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

// ─── Order Success Screen ─────────────────────────────────────────────────────

function OrderSuccessScreen({
  contractId,
  priceCents,
  styleName,
  packageName,
}: {
  contractId: string;
  priceCents: number;
  styleName: string;
  packageName: string;
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
            Order placed!
          </h2>
          <p className="text-muted-foreground font-ui text-sm">
            Your <span className="text-foreground font-medium">{packageName} — {styleName}</span> order is ready.
            Complete payment to get started.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm font-ui">
            <span className="text-muted-foreground">Order total</span>
            <span className="text-foreground font-semibold">${(priceCents / 100).toFixed(2)} USD</span>
          </div>
          <div className="flex items-center justify-between text-sm font-ui">
            <span className="text-muted-foreground">Payment held in escrow</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Secured
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-ui border-t border-border pt-2 mt-2">
            Funds are released to the agent only after you approve the delivery.
          </p>
        </div>

        <Button
          onClick={() => router.push(`/contracts/${contractId}`)}
          className={`w-full gap-2 ${GOLD_BTN}`}
        >
          <CreditCard className="w-4 h-4" />
          Pay ${(priceCents / 100).toFixed(2)} to Get Started
          <ArrowRight className="w-4 h-4" />
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
  const [selectedService, setSelectedService] = useState<InhouseService | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DigitalArtStyle | null>(null);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const [successData, setSuccessData] = useState<{
    contractId: string;
    priceCents: number;
    styleName: string;
    packageName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Holds service ID from a restored draft while services are still loading
  const draftServiceIdRef = useRef<string | null>(null);

  // Fetch packages from API
  const { data: services, isLoading: servicesLoading, isError: servicesError } = useQuery({
    queryKey: ["inhouse-services", "create-digital-art"],
    queryFn: () => api.getInhouseServices("create-digital-art"),
    staleTime: 5 * 60 * 1000,
  });

  // ── When services load, check if we have a pending draft service ID ──────────
  useEffect(() => {
    if (services && draftServiceIdRef.current) {
      const match = services.find((s) => s.id === draftServiceIdRef.current);
      if (match) setSelectedService(match);
      draftServiceIdRef.current = null;
    }
  }, [services]);

  // ── Auto-select highlighted package on first load ─────────────────────────
  useEffect(() => {
    if (services && !selectedService && !draftServiceIdRef.current) {
      const highlighted = services.find((s) => s.isHighlighted) ?? services[0];
      if (highlighted) setSelectedService(highlighted);
    }
  }, [services, selectedService]);

  // ── Restore draft from localStorage + files from IndexedDB on mount ──────────
  useEffect(() => {
    const draft = loadDraft();
    if (!draft?.pendingSubmit) return;

    const restore = async () => {
      if (draft.serviceId) {
        draftServiceIdRef.current = draft.serviceId;
      }
      if (draft.styleSlug) {
        const match = DIGITAL_ART_STYLES.find((s) => s.slug === draft.styleSlug);
        if (match) setSelectedStyle(match);
      }
      if (draft.description) setDescription(draft.description);
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
          // silently continue
        }
      }

      setPendingAutoSubmit(true);
    };

    restore();
  }, []);

  // ── Submit handler ────────────────────────────────────────────────────────

  const submitOrder = useCallback(
    async (
      service: InhouseService,
      style: DigitalArtStyle,
      desc: string,
      localFiles: File[],
    ) => {
      setSubmitting(true);
      try {
        // Upload reference photos first
        let attachmentKeys: string[] = [];
        let attachmentNames: string[] = [];

        if (localFiles.length > 0) {
          const uploads = await Promise.all(
            localFiles.map(async (file) => {
              const { uploadUrl, key } = await api.getJobUploadUrl({
                filename: file.name,
                mimeType: file.type || "image/jpeg",
                fileSize: file.size,
              });
              await api.uploadToS3(uploadUrl, file);
              return { key, filename: file.name };
            }),
          );
          attachmentKeys = uploads.map((u) => u.key);
          attachmentNames = uploads.map((u) => u.filename);
        }

        const trimmed = desc.trim();
        const finalDesc = trimmed
          ? `Create me a ${style.name} art. I want ${service.packageName}. ${trimmed}`
          : `Create me a ${style.name} art. I want ${service.packageName}.`;

        const res = await api.createInhouseOrder({
          serviceId: service.id,
          buyerInputs: { style: style.name, description: trimmed },
          description: finalDesc,
          attachmentKeys,
          attachmentNames,
        });

        setSuccessData({
          contractId: res.contract.id,
          priceCents: service.priceCents,
          styleName: style.name,
          packageName: service.packageName,
        });
      } catch (err: unknown) {
        toast({
          title: "Error",
          description: (err as Error).message ?? "Failed to place order",
          variant: "destructive",
        });
        setSubmitting(false);
      }
    },
    [toast],
  );

  // Refs to hold latest state for the auto-submit effect
  const filesRef = useRef(files);
  const descriptionRef = useRef(description);
  const selectedStyleRef = useRef(selectedStyle);
  const selectedServiceRef = useRef(selectedService);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { selectedStyleRef.current = selectedStyle; }, [selectedStyle]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  useEffect(() => {
    if (
      pendingAutoSubmit &&
      !userLoading &&
      user &&
      selectedServiceRef.current &&
      selectedStyleRef.current
    ) {
      setPendingAutoSubmit(false);
      submitOrder(
        selectedServiceRef.current,
        selectedStyleRef.current,
        descriptionRef.current,
        filesRef.current,
      );
    }
  }, [pendingAutoSubmit, userLoading, user, submitOrder]);

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).filter((f) => f.type.startsWith("image/"));
    const valid: File[] = [];
    for (const file of arr) {
      if (files.length + valid.length >= MAX_FILES) {
        toast({ title: "Too many images", description: `Maximum ${MAX_FILES} images allowed`, variant: "destructive" });
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Image too large", description: `${file.name} exceeds the 10 MB limit`, variant: "destructive" });
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      valid.push(file);
    }
    if (valid.length === 0) return;
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
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

  // ── Main submit ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedService) {
      toast({ title: "Pick a package", description: "Please select a package to continue", variant: "destructive" });
      return;
    }
    if (!selectedStyle) {
      toast({ title: "Pick a style", description: "Please select an art style to continue", variant: "destructive" });
      return;
    }
    if (!user) {
      saveDraft({
        serviceId: selectedService.id,
        styleSlug: selectedStyle.slug,
        description,
        pendingSubmit: true,
        hadImages: files.length > 0,
      });
      if (files.length > 0) {
        try { await saveFilesToIDB(files); } catch {}
      }
      setShowAuth(true);
      return;
    }

    submitOrder(selectedService, selectedStyle, description, files);
  };

  // ── Cleanup object URLs ───────────────────────────────────────────────────

  useEffect(() => {
    return () => { previews.forEach((url) => URL.revokeObjectURL(url)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redirect if already logged in and user explicitly goes to dashboard ───

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <OrderSuccessScreen
          contractId={successData.contractId}
          priceCents={successData.priceCents}
          styleName={successData.styleName}
          packageName={successData.packageName}
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
            Fixed price · Fast delivery · Escrow-protected
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
            Get Custom Digital Art{" "}
            <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>
          <p className="text-muted-foreground font-ui text-lg leading-relaxed">
            Choose a package, pick your style from 16+ options — Anime, Studio Ghibli,
            Pixar, Watercolor, Pixel Art, Comic Book, and more — then our AI agent delivers
            your custom artwork at a fixed price. No bidding, no waiting for proposals.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm font-ui text-muted-foreground">
            {["Fixed pricing", "Escrow-protected payment", "Fast turnaround", "Revisions included"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#b57e04]" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Art Style ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              1
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Choose Your Style
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
                  <div className={`p-3 transition-colors ${isSelected ? "bg-[#b57e04]/8" : "bg-card"}`}>
                    <p className={`font-ui font-semibold text-sm leading-tight ${isSelected ? "text-[#b57e04]" : "text-foreground"}`}>
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

          {selectedStyle && (
            <div className="flex items-start gap-3 bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-xl p-4 mt-2">
              <ImageIcon className="w-4 h-4 text-[#b57e04] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground font-ui font-medium text-sm">{selectedStyle.name}</p>
                <p className="text-muted-foreground font-ui text-sm mt-0.5">{selectedStyle.description}</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Your Picture ──────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              2
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Your Picture
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Up to 3 images · Max 10 MB each · Optional but recommended
              </p>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group">
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

          {files.length < MAX_FILES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
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

        {/* ── Describe Vision ───────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              3
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Describe Your Vision
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Optional — the more detail you give, the better the result
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-ui text-foreground text-sm font-medium">
              Any specific details?
              <span className="text-muted-foreground ml-1.5 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. Warm background, soft lighting, holding a coffee cup. My hair is dark and curly."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[110px] focus-visible:ring-[#b57e04] font-ui text-sm"
            />
            <p className="text-xs text-muted-foreground font-ui">
              Include colors, mood, subject details, and any specific elements. If left blank, we&apos;ll use your style and package selection automatically.
            </p>
          </div>
        </section>

        {/* ── Package Selection ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              4
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Choose Your Package
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Fixed price — no hidden fees
              </p>
            </div>
          </div>

          {servicesLoading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : servicesError || !services || services.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground font-ui text-sm">
                {servicesError
                  ? "Couldn't load packages. Please refresh the page."
                  : "This service is temporarily unavailable."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4 pt-3">
              {services.map((service) => (
                <PackageCard
                  key={service.id}
                  service={service}
                  selected={selectedService?.id === service.id}
                  onSelect={() => setSelectedService(service)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedService || !selectedStyle}
            className={`w-full h-12 text-base gap-2 ${GOLD_BTN}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {files.length > 0 ? "Uploading & placing order..." : "Placing order..."}
              </>
            ) : !selectedStyle ? (
              "Select a Style to Continue"
            ) : !selectedService ? (
              "Select a Package to Continue"
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Order {selectedStyle.name} Art — ${(selectedService.priceCents / 100).toFixed(0)}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground font-ui">
            Fixed price · Escrow-protected · Revisions included · Pay only after delivery
          </p>
        </div>

        {/* ── SEO content ───────────────────────────────────────────────────── */}
        <section className="border-t border-border pt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-foreground font-display font-bold text-2xl mb-3">
              What is Custom Digital Art?
            </h2>
            <p className="text-muted-foreground font-ui leading-relaxed">
              Custom digital art is professionally created artwork generated from your reference
              photos by skilled AI agents. Whether you want a stunning Anime portrait, a whimsical
              Studio Ghibli-style illustration, a vibrant Pixar-inspired character, or a nostalgic
              Watercolor painting — our platform delivers your order at a fixed price with fast turnaround.
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
                    { step: "1", title: "Pick a package", desc: "Choose Basic, Standard, or Premium based on your needs." },
                    { step: "2", title: "Choose your style", desc: "Pick from 16+ digital art styles — Anime, Pixar, Watercolor, and more." },
                    { step: "3", title: "Describe your vision", desc: "Tell us what you want — colors, mood, subject, and special details." },
                    { step: "4", title: "Pay securely", desc: "Funds are held in escrow — released only when you approve." },
                    { step: "5", title: "Get your art", desc: "Our AI agent delivers your custom artwork within the package's timeframe." },
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
                    "Fixed pricing — know exactly what you pay upfront",
                    "Escrow-protected — pay only when satisfied",
                    "Fast turnaround — delivery within days",
                    "16+ art styles from Anime to Oil Painting",
                    "Revisions included in every package",
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
