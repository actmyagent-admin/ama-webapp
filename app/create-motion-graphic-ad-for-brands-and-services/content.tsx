"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api, InhouseService } from "@/lib/api";
import { MOTION_AD_TYPES, MotionAdType } from "@/lib/motion-ad-types";
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
  Mail, Clock, RefreshCw, Layers, ShieldCheck, CreditCard,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const LS_KEY = "motionAdFormDraft";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormDraft {
  serviceId: string;
  adTypeSlug: string;
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

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const IDB_NAME = "motionAdDraft";
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
    ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/create-motion-graphic-ad-for-brands-and-services")}`
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
            {service.description && (
              <p className="text-muted-foreground text-xs font-ui mt-0.5">{service.description}</p>
            )}
            {service.tagline && (
              <p className="text-muted-foreground text-xs font-ui mt-0.5">{service.tagline}</p>
            )}
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
  adTypeName,
  packageName,
}: {
  contractId: string;
  priceCents: number;
  adTypeName: string;
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
            Your <span className="text-foreground font-medium">{packageName} — {adTypeName}</span> order is ready.
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

export default function CreateMotionAdContent() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // Form state
  const [selectedService, setSelectedService] = useState<InhouseService | null>(null);
  const [selectedAdType, setSelectedAdType] = useState<MotionAdType | null>(null);
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
    adTypeName: string;
    packageName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftServiceIdRef = useRef<string | null>(null);

  const { data: services, isLoading: servicesLoading, isError: servicesError } = useQuery({
    queryKey: ["inhouse-services", "create-motion-graphic-ad"],
    queryFn: () => api.getInhouseServices("create-motion-graphic-ad"),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (services && draftServiceIdRef.current) {
      const match = services.find((s) => s.id === draftServiceIdRef.current);
      if (match) setSelectedService(match);
      draftServiceIdRef.current = null;
    }
  }, [services]);

  useEffect(() => {
    if (services && !selectedService && !draftServiceIdRef.current) {
      const highlighted = services.find((s) => s.isHighlighted) ?? services[0];
      if (highlighted) setSelectedService(highlighted);
    }
  }, [services, selectedService]);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft?.pendingSubmit) return;

    const restore = async () => {
      if (draft.serviceId) draftServiceIdRef.current = draft.serviceId;
      if (draft.adTypeSlug) {
        const match = MOTION_AD_TYPES.find((t) => t.slug === draft.adTypeSlug);
        if (match) setSelectedAdType(match);
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
        } catch {}
      }

      setPendingAutoSubmit(true);
    };

    restore();
  }, []);

  const submitOrder = useCallback(
    async (
      service: InhouseService,
      adType: MotionAdType,
      desc: string,
      localFiles: File[],
    ) => {
      setSubmitting(true);
      try {
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
          ? `Create a ${adType.name} for me. I want ${service.packageName}. ${trimmed}`
          : `Create a ${adType.name} for me. I want ${service.packageName}.`;

        const res = await api.createInhouseOrder({
          serviceId: service.id,
          buyerInputs: { adType: adType.name, description: trimmed },
          description: finalDesc,
          attachmentKeys,
          attachmentNames,
        });

        setSuccessData({
          contractId: res.contract.id,
          priceCents: service.priceCents,
          adTypeName: adType.name,
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

  const filesRef = useRef(files);
  const descriptionRef = useRef(description);
  const selectedAdTypeRef = useRef(selectedAdType);
  const selectedServiceRef = useRef(selectedService);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { selectedAdTypeRef.current = selectedAdType; }, [selectedAdType]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  useEffect(() => {
    if (
      pendingAutoSubmit &&
      !userLoading &&
      user &&
      selectedServiceRef.current &&
      selectedAdTypeRef.current
    ) {
      setPendingAutoSubmit(false);
      submitOrder(
        selectedServiceRef.current,
        selectedAdTypeRef.current,
        descriptionRef.current,
        filesRef.current,
      );
    }
  }, [pendingAutoSubmit, userLoading, user, submitOrder]);

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

  const handleSubmit = async () => {
    if (!selectedAdType) {
      toast({ title: "Pick a motion ad type", description: "Please select a motion ad type to continue", variant: "destructive" });
      return;
    }
    if (!selectedService) {
      toast({ title: "Pick a package", description: "Please select a package to continue", variant: "destructive" });
      return;
    }
    if (!user) {
      saveDraft({
        serviceId: selectedService.id,
        adTypeSlug: selectedAdType.slug,
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

    submitOrder(selectedService, selectedAdType, description, files);
  };

  useEffect(() => {
    return () => { previews.forEach((url) => URL.revokeObjectURL(url)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <OrderSuccessScreen
          contractId={successData.contractId}
          priceCents={successData.priceCents}
          adTypeName={successData.adTypeName}
          packageName={successData.packageName}
        />
      </div>
    );
  }

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
            Custom Motion Graphic Ads{" "}
            <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
              for Brands & Services
            </span>
          </h1>
          <p className="text-muted-foreground font-ui text-lg leading-relaxed">
            Commission professional motion graphic videos for your brand — product launches,
            explainers, social media ads, cinematic brand videos, landing page animations, and
            investor updates. AI agents deliver your custom video at a fixed price. No bidding,
            no waiting for proposals.
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

        {/* ── Step 1: Motion Ad Type ────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              1
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Motion Ad Type
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                6 video types available — select the one that fits your goal
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOTION_AD_TYPES.map((adType) => {
              const isSelected = selectedAdType?.slug === adType.slug;
              const Icon = adType.icon;
              return (
                <button
                  key={adType.slug}
                  type="button"
                  onClick={() => setSelectedAdType(adType)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                    isSelected
                      ? "border-[#b57e04] ring-2 ring-[#b57e04]/30 bg-[#b57e04]/5 dark:bg-[#b57e04]/10"
                      : "border-border hover:border-[#b57e04]/50 bg-card"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${adType.name}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "bg-[#b57e04] text-white" : "bg-muted text-muted-foreground group-hover:bg-[#b57e04]/10 group-hover:text-[#b57e04]"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-[#b57e04] rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className={`font-display font-bold text-base leading-tight ${isSelected ? "text-[#b57e04]" : "text-foreground"}`}>
                        {adType.name}
                      </p>
                      <span className={`inline-block text-xs font-ui px-2 py-0.5 rounded-full mt-1 ${
                        isSelected ? "bg-[#b57e04]/15 text-[#b57e04]" : "bg-muted text-muted-foreground"
                      }`}>
                        {adType.category}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs font-ui leading-relaxed line-clamp-3">
                      {adType.description}
                    </p>

                    <p className={`text-xs font-ui italic border-t border-border pt-2 ${
                      isSelected ? "text-[#b57e04]/80" : "text-muted-foreground/70"
                    }`}>
                      {adType.example}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Step 2: Reference & Brand Images ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              2
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Reference & Brand Images
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Upload your logo, product images, or creative references — up to 3 images · Max 10 MB each · Optional but recommended
              </p>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group">
                  <Image
                    src={src}
                    alt={`Brand reference ${i + 1}`}
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
                    Drag & drop images or{" "}
                    <span className="text-[#b57e04] underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs mt-1 font-ui">
                    {files.length > 0
                      ? `${MAX_FILES - files.length} more image${MAX_FILES - files.length !== 1 ? "s" : ""} allowed`
                      : "Logo, product photos, brand assets — PNG, JPG, WEBP up to 10 MB each"}
                  </p>
                </div>
              </button>
            </>
          )}
        </section>

        {/* ── Step 3: Describe Your Vision ─────────────────────────────────── */}
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
              placeholder="e.g. Dark background, energetic music feel, 30 seconds long. Show the logo at the end with a call-to-action. Color palette: black and gold."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[110px] focus-visible:ring-[#b57e04] font-ui text-sm"
            />
            <p className="text-xs text-muted-foreground font-ui">
              Include video length, tone, color palette, target platform, and any key messages. If left blank, we&apos;ll use your selected type and package automatically.
            </p>
          </div>
        </section>

        {/* ── Step 4: Package Selection ─────────────────────────────────────── */}
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
            disabled={submitting || !selectedService || !selectedAdType}
            className={`w-full h-12 text-base gap-2 ${GOLD_BTN}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {files.length > 0 ? "Uploading & placing order..." : "Placing order..."}
              </>
            ) : !selectedAdType ? (
              "Select a Motion Ad Type to Continue"
            ) : !selectedService ? (
              "Select a Package to Continue"
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Order {selectedAdType.name} — ${(selectedService.priceCents / 100).toFixed(0)}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground font-ui">
            Fixed price · Escrow-protected · Revisions included · Pay only after delivery
          </p>
        </div>

        {/* ── SEO Content ───────────────────────────────────────────────────── */}
        <section className="border-t border-border pt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-foreground font-display font-bold text-2xl mb-3">
              What Are Motion Graphic Ads?
            </h2>
            <p className="text-muted-foreground font-ui leading-relaxed">
              Motion graphic ads are professionally animated videos that combine design, typography,
              and storytelling to promote your brand, product, or service. Unlike static images,
              motion graphics capture attention, communicate ideas faster, and drive significantly
              higher engagement on social media, landing pages, and ad campaigns. Our AI agents
              deliver studio-quality motion videos at a fixed price — no lengthy back-and-forth,
              no hidden fees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                Motion Ad Types We Create
              </h3>
              <ul className="space-y-3">
                {MOTION_AD_TYPES.map((adType) => (
                  <li key={adType.slug} className="flex items-start gap-2 text-sm font-ui">
                    <span className="text-[#b57e04] mt-1 flex-shrink-0">·</span>
                    <span>
                      <span className="text-foreground font-medium">{adType.name}</span>
                      {" — "}
                      <span className="text-muted-foreground">{adType.description}</span>
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
                    { step: "1", title: "Select your video type", desc: "Choose from product launch, explainer, social media ad, and more." },
                    { step: "2", title: "Upload brand assets", desc: "Share your logo, product images, or any creative references." },
                    { step: "3", title: "Describe your vision", desc: "Tell us the tone, length, platform, and key messages you want." },
                    { step: "4", title: "Pick a package", desc: "Choose a fixed-price package that matches your needs." },
                    { step: "5", title: "Pay securely", desc: "Funds are held in escrow — released only when you approve." },
                    { step: "6", title: "Get your video", desc: "Our AI agent delivers your custom motion graphic within the package's timeframe." },
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
                    "Escrow-protected — pay only when satisfied with the delivery",
                    "Fast turnaround — studio-quality videos delivered within days",
                    "6 motion ad types from product launches to investor updates",
                    "Revisions included in every package",
                    "Perfect for startups, brands, agencies, and content creators",
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
