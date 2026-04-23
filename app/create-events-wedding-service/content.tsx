"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api, InhouseService } from "@/lib/api";
import { WEDDING_EVENT_TYPES, WeddingEventType } from "@/lib/wedding-event-types";
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
  Mail, Clock, RefreshCw, ShieldCheck, CreditCard, Layers,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const LS_KEY = "weddingEventFormDraft";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormDraft {
  serviceId: string;
  eventTypeSlug: string;
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

const IDB_NAME = "weddingEventDraft";
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
    ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/create-events-wedding-service")}`
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
      className={`relative rounded-2xl border-2 p-6 text-left transition-all w-full flex flex-col gap-4 ${
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

      {/* Header: name + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-display font-bold text-xl leading-tight ${selected ? "text-[#b57e04]" : "text-foreground"}`}>
            {service.packageName}
          </p>
          {selected && (
            <div className="w-5 h-5 bg-[#b57e04] rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-3xl font-display font-bold ${selected ? "text-[#b57e04]" : "text-foreground"}`}>
            {price}
          </span>
          <span className="text-muted-foreground text-xs font-ui block">USD</span>
        </div>
      </div>

      {/* Tagline */}
      {service.tagline && (
        <p className="text-muted-foreground text-sm font-ui -mt-2 leading-snug">
          {service.tagline}
        </p>
      )}

      {/* Perfect for */}
      {service.perfectFor.length > 0 && (
        <div className={`rounded-xl px-3 py-2.5 text-xs font-ui ${
          selected ? "bg-[#b57e04]/10 border border-[#b57e04]/20" : "bg-muted/50 border border-border"
        }`}>
          <span className={`font-semibold ${selected ? "text-[#b57e04]" : "text-foreground"}`}>
            Best for:{" "}
          </span>
          <span className="text-muted-foreground">{service.perfectFor.join(", ")}</span>
        </div>
      )}

      {/* Delivery meta */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-ui text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
          <Clock className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
          {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""} delivery
        </div>
        <div className="flex items-center gap-1.5 text-xs font-ui text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
          <RefreshCw className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
          {service.revisionsIncluded} revision{service.revisionsIncluded !== 1 ? "s" : ""}
        </div>
        {service.deliveryVariants > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-ui text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
            <Layers className="w-3 h-3 flex-shrink-0 text-[#b57e04]" />
            {service.deliveryVariants} variants
          </div>
        )}
      </div>

      {/* What's included */}
      {service.whatsIncluded.length > 0 && (
        <ul className="space-y-1.5 border-t border-border pt-4">
          {service.whatsIncluded.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs font-ui">
              <CheckCircle className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

// ─── Order Success Screen ─────────────────────────────────────────────────────

function OrderSuccessScreen({
  contractId,
  priceCents,
  eventTypeName,
  packageName,
}: {
  contractId: string;
  priceCents: number;
  eventTypeName: string;
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
            Your <span className="text-foreground font-medium">{packageName} — {eventTypeName}</span> order is ready.
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

export default function CreateWeddingEventContent() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // Form state
  const [selectedService, setSelectedService] = useState<InhouseService | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<WeddingEventType | null>(null);
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
    eventTypeName: string;
    packageName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftServiceIdRef = useRef<string | null>(null);

  const { data: services, isLoading: servicesLoading, isError: servicesError } = useQuery({
    queryKey: ["inhouse-services", "create-events-wedding-service"],
    queryFn: () => api.getInhouseServices("create-events-wedding-service"),
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
      if (draft.eventTypeSlug) {
        const match = WEDDING_EVENT_TYPES.find((t) => t.slug === draft.eventTypeSlug);
        if (match) setSelectedEventType(match);
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
      eventType: WeddingEventType,
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
          ? `Create ${eventType.name} content for me. I want the ${service.packageName} package. ${trimmed}`
          : `Create ${eventType.name} content for me. I want the ${service.packageName} package.`;

        const res = await api.createInhouseOrder({
          serviceId: service.id,
          buyerInputs: { eventType: eventType.name, description: trimmed },
          description: finalDesc,
          attachmentKeys,
          attachmentNames,
        });

        setSuccessData({
          contractId: res.contract.id,
          priceCents: service.priceCents,
          eventTypeName: eventType.name,
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
  const selectedEventTypeRef = useRef(selectedEventType);
  const selectedServiceRef = useRef(selectedService);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { selectedEventTypeRef.current = selectedEventType; }, [selectedEventType]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  useEffect(() => {
    if (
      pendingAutoSubmit &&
      !userLoading &&
      user &&
      selectedServiceRef.current &&
      selectedEventTypeRef.current
    ) {
      setPendingAutoSubmit(false);
      submitOrder(
        selectedServiceRef.current,
        selectedEventTypeRef.current,
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
        toast({ title: "Too many photos", description: `Maximum ${MAX_FILES} photos allowed`, variant: "destructive" });
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Photo too large", description: `${file.name} exceeds the 10 MB limit`, variant: "destructive" });
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
    if (!selectedEventType) {
      toast({ title: "Pick an event type", description: "Please select your event type to continue", variant: "destructive" });
      return;
    }
    if (!selectedService) {
      toast({ title: "Pick a package", description: "Please select a package to continue", variant: "destructive" });
      return;
    }
    if (!user) {
      saveDraft({
        serviceId: selectedService.id,
        eventTypeSlug: selectedEventType.slug,
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

    submitOrder(selectedService, selectedEventType, description, files);
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
          eventTypeName={successData.eventTypeName}
          packageName={successData.packageName}
        />
      </div>
    );
  }

  return (
    <>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 rounded-full px-4 py-1.5 text-sm font-ui font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fixed price · Fast delivery · Escrow-protected
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
            Beautiful Content for{" "}
            <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
              Your Special Day
            </span>
          </h1>
          <p className="text-muted-foreground font-ui text-lg leading-relaxed">
            From personalized digital invitations and cinematic video montages to custom original songs,
            heartfelt speeches, and full event microsites — AI agents create a complete digital experience
            for your wedding, birthday, anniversary, or celebration. Fixed price, no surprises.
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

        {/* ── Step 1: Event Type ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              1
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                What&apos;s the Occasion?
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                6 event types — select the one that matches your celebration
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEDDING_EVENT_TYPES.map((eventType) => {
              const isSelected = selectedEventType?.slug === eventType.slug;
              const Icon = eventType.icon;
              return (
                <button
                  key={eventType.slug}
                  type="button"
                  onClick={() => setSelectedEventType(eventType)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all group ${
                    isSelected
                      ? "border-[#b57e04] ring-2 ring-[#b57e04]/30 bg-[#b57e04]/5 dark:bg-[#b57e04]/10"
                      : "border-border hover:border-[#b57e04]/50 bg-card"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${eventType.name}`}
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
                        {eventType.name}
                      </p>
                      <span className={`inline-block text-xs font-ui px-2 py-0.5 rounded-full mt-1 ${
                        isSelected ? "bg-[#b57e04]/15 text-[#b57e04]" : "bg-muted text-muted-foreground"
                      }`}>
                        {eventType.category}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs font-ui leading-relaxed line-clamp-3">
                      {eventType.description}
                    </p>

                    <p className={`text-xs font-ui italic border-t border-border pt-2 ${
                      isSelected ? "text-[#b57e04]/80" : "text-muted-foreground/70"
                    }`}>
                      {eventType.example}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Step 2: Upload Photos ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              2
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Your Photos & Media
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Upload your favorite photos or video stills — up to 5 images · Max 10 MB each · Optional but recommended
              </p>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group">
                  <Image
                    src={src}
                    alt={`Event photo ${i + 1}`}
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
                      : "Couple photos, venue shots, family portraits — PNG, JPG, WEBP up to 10 MB each"}
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
                Tell Us About Your Event
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Optional — the more detail you share, the more personalized the result
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-ui text-foreground text-sm font-medium">
              Event details & personal notes
              <span className="text-muted-foreground ml-1.5 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. Our wedding is on June 14th at a garden venue. Our theme is rustic gold and white. Names: Sarah & James. We'd love a warm, romantic tone with soft piano music. For the song, our story started in college — we'd love lyrics about that."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[130px] focus-visible:ring-[#b57e04] font-ui text-sm"
            />
            <p className="text-xs text-muted-foreground font-ui">
              Include names, date, venue, theme, tone, music preferences, and any personal story details. The more you share, the more meaningful the final result.
            </p>
          </div>
        </section>

        {/* ── Step 4: Package Selection ─────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
              4
            </div>
            <div>
              <h2 className="text-foreground font-display font-semibold text-xl">
                Choose Your Package
              </h2>
              <p className="text-muted-foreground font-ui text-sm">
                Fixed price — no hidden fees. Choose what fits your celebration.
              </p>
            </div>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
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
          <div className="w-full lg:max-w-[576px] lg:mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedService || !selectedEventType}
              className={`w-full h-12 text-base gap-2 ${GOLD_BTN}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {files.length > 0 ? "Uploading & placing order..." : "Placing order..."}
                </>
              ) : !selectedEventType ? (
                "Select Your Event Type to Continue"
              ) : !selectedService ? (
                "Select a Package to Continue"
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Order {selectedEventType.name} — ${(selectedService.priceCents / 100).toFixed(0)}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground font-ui">
            Fixed price · Escrow-protected · Revisions included · Pay only after delivery
          </p>
        </div>

        {/* ── SEO Content ───────────────────────────────────────────────────── */}
        <section className="border-t border-border pt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-foreground font-display font-bold text-2xl mb-3">
              What Is a Complete Wedding & Event Content Experience?
            </h2>
            <p className="text-muted-foreground font-ui leading-relaxed">
              A complete wedding or event content experience goes beyond a simple invitation. It
              combines personalized digital invitations, cinematic photo and video montages, original
              custom songs with lyrics written for your story, heartfelt speeches, and a beautiful
              event microsite with an RSVP form and media gallery — all crafted specifically for you.
              Our AI agents deliver everything at a fixed price, so you can focus on celebrating.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                What&apos;s Included Across Packages
              </h3>
              <ul className="space-y-2">
                {[
                  "Custom digital invitation & RSVP card",
                  "Image montage — photo slideshow",
                  "Basic to cinematic video montage",
                  "Invitation motion video (animated invite)",
                  "Background music + smooth transitions",
                  "Custom original song (personalized lyrics)",
                  "Wedding or event speech writing",
                  "Event microsite (static website)",
                  "RSVP form integration",
                  "Media gallery for photos & videos",
                  "Enhanced personalization — names, dates, theme",
                  "Warm, cinematic, or romantic tone — your choice",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-ui">
                    <CheckCircle className="w-3.5 h-3.5 text-[#b57e04] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
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
                    { step: "1", title: "Choose your event type", desc: "Select from wedding, birthday, anniversary, baby shower, graduation, or corporate event." },
                    { step: "2", title: "Upload your photos", desc: "Share your favorite couple shots, venue photos, or cherished memories." },
                    { step: "3", title: "Describe your vision", desc: "Tell us names, date, theme, tone, music preferences, and your personal story." },
                    { step: "4", title: "Pick a package", desc: "Choose Essential Invite, Cinematic Experience, or Full Celebration Package." },
                    { step: "5", title: "Pay securely", desc: "Funds are held in escrow — released only when you approve the delivery." },
                    { step: "6", title: "Receive your content", desc: "Get beautiful, personalized event content delivered within days." },
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
                    "Escrow-protected — pay only when you love the result",
                    "Fast turnaround — content delivered within days",
                    "Fully personalized — your names, story, and theme",
                    "From invites to custom songs and event microsites",
                    "Perfect for weddings, birthdays, anniversaries & more",
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
