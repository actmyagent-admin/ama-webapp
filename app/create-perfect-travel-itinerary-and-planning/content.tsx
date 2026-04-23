"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, InhouseService } from "@/lib/api";
import { getBrowserClient } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Loader2, Sparkles, ArrowRight, Mail, Clock, RefreshCw,
  ShieldCheck, CreditCard, Layers, MapPin, Plane, Plus, Minus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_BTN =
  "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const LS_KEY = "travelItineraryFormDraft";

const TRIP_TYPES = [
  "Romantic ❤️", "Family 👨‍👩‍👧‍👦", "Solo 🧍", "Friends 🎉",
  "Adventure ⛰️", "Relaxation 🏖️", "Cultural 🏛️", "Food-focused 🍜",
];

const INTERESTS = [
  "Sightseeing", "Nature", "Beaches", "Nightlife",
  "Shopping", "Food & restaurants", "Museums & history",
  "Adventure sports", "Photography spots",
];

const FOOD_RESTRICTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher"];

const FOOD_EXPERIENCES = ["Street food", "Cafes", "Fine dining", "Mix of everything"];

const ACCOMMODATIONS = ["Hotel", "Airbnb", "Boutique stay", "Luxury resort", "No preference"];

const TRAVEL_PURPOSES = ["Vacation", "Honeymoon", "Business + leisure", "Special occasion"];

const MAX_INTERESTS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TravelFormState {
  destination: string;
  startDate: string;
  endDate: string;
  flexibleDates: boolean;
  adults: number;
  hasKids: boolean;
  kidCount: number;
  kidAges: string;
  budget: string;
  tripTypes: string[];
  pace: string;
  interests: string[];
  mustVisit: string;
  showAvoid: boolean;
  avoid: string;
  foodRestrictions: string[];
  foodExperience: string;
  // Premium-only
  departureCity: string;
  accommodation: string;
  travelPurpose: string;
  visaGuidance: boolean;
  // Always
  additionalNotes: string;
}

interface FormDraft {
  serviceId: string;
  form: TravelFormState;
  pendingSubmit: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const INITIAL_FORM: TravelFormState = {
  destination: "",
  startDate: "",
  endDate: "",
  flexibleDates: false,
  adults: 2,
  hasKids: false,
  kidCount: 1,
  kidAges: "",
  budget: "Mid-range",
  tripTypes: [],
  pace: "Balanced",
  interests: [],
  mustVisit: "",
  showAvoid: false,
  avoid: "",
  foodRestrictions: [],
  foodExperience: "Mix of everything",
  departureCity: "",
  accommodation: "",
  travelPurpose: "",
  visaGuidance: false,
  additionalNotes: "",
};

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

// ─── Payload builders ─────────────────────────────────────────────────────────

function buildBuyerInputs(form: TravelFormState, isPremium: boolean): Record<string, unknown> {
  const inputs: Record<string, unknown> = {
    destination: form.destination,
    startDate: form.startDate || "Not specified",
    endDate: form.endDate || "Not specified",
    flexibleDates: form.flexibleDates ? "Yes" : "No",
    adults: form.adults,
    kids:
      form.hasKids && form.kidCount > 0
        ? `${form.kidCount}${form.kidAges ? ` (ages: ${form.kidAges})` : ""}`
        : "None",
    budget: form.budget || "Mid-range",
    tripTypes: form.tripTypes.length > 0 ? form.tripTypes.join(", ") : "Not specified",
    pace: form.pace || "Balanced",
    interests: form.interests.length > 0 ? form.interests.join(", ") : "Not specified",
    mustVisit: form.mustVisit.trim() || "",
    avoid: form.avoid.trim() || "",
    foodRestrictions:
      form.foodRestrictions.length > 0 ? form.foodRestrictions.join(", ") : "No restrictions",
    foodExperience: form.foodExperience || "Mix of everything",
  };

  if (isPremium) {
    inputs.departureCity = form.departureCity.trim() || "";
    inputs.accommodation = form.accommodation || "No preference";
    inputs.travelPurpose = form.travelPurpose || "Not specified";
    inputs.visaGuidance = form.visaGuidance ? "Yes" : "No";
  }

  if (form.additionalNotes.trim()) inputs.additionalNotes = form.additionalNotes.trim();

  return inputs;
}

function buildDescription(form: TravelFormState, service: InhouseService, isPremium: boolean): string {
  const lines: string[] = [`I want a ${service.packageName}.`];

  if (form.destination) {
    let line = `Destination: ${form.destination}`;
    if (form.startDate && form.endDate) {
      line += ` | Dates: ${form.startDate} to ${form.endDate}`;
      if (form.flexibleDates) line += " (flexible)";
    } else if (form.startDate) {
      line += ` | Departing: ${form.startDate}`;
    }
    lines.push(line + ".");
  }

  let travelerLine = `Travelers: ${form.adults} adult${form.adults !== 1 ? "s" : ""}`;
  if (form.hasKids && form.kidCount > 0) {
    travelerLine += `, ${form.kidCount} kid${form.kidCount !== 1 ? "s" : ""}`;
    if (form.kidAges) travelerLine += ` (ages: ${form.kidAges})`;
  }
  lines.push(travelerLine + ".");

  if (form.budget) lines.push(`Budget: ${form.budget}.`);
  if (form.tripTypes.length > 0) lines.push(`Trip type: ${form.tripTypes.join(", ")}.`);
  if (form.pace) lines.push(`Pace: ${form.pace}.`);

  if (form.interests.length > 0) lines.push(`Interests: ${form.interests.join(", ")}.`);
  if (form.mustVisit.trim()) lines.push(`Must-visit: ${form.mustVisit.trim()}.`);
  if (form.avoid.trim()) lines.push(`Want to avoid: ${form.avoid.trim()}.`);

  const food =
    form.foodRestrictions.length > 0 ? form.foodRestrictions.join(", ") : "No restrictions";
  lines.push(`Food: ${food}${form.foodExperience ? `. Prefer ${form.foodExperience}` : ""}.`);

  if (isPremium) {
    if (form.departureCity.trim()) lines.push(`Departing from: ${form.departureCity.trim()}.`);
    if (form.accommodation) lines.push(`Accommodation preference: ${form.accommodation}.`);
    if (form.travelPurpose) lines.push(`Travel purpose: ${form.travelPurpose}.`);
    if (form.visaGuidance) lines.push("Visa guidance needed.");
  }

  if (form.additionalNotes.trim()) lines.push(`Additional notes: ${form.additionalNotes.trim()}.`);

  return lines.join(" ");
}

// ─── Small shared components ──────────────────────────────────────────────────

function SectionHeader({
  step, title, subtitle,
}: { step: number | React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-7 h-7 rounded-full bg-[#b57e04] text-white flex items-center justify-center text-sm font-semibold font-ui flex-shrink-0">
        {step}
      </div>
      <div>
        <h2 className="text-foreground font-display font-semibold text-xl">{title}</h2>
        <p className="text-muted-foreground font-ui text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

function ToggleChip({
  label, selected, onToggle,
}: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-xs font-ui font-medium px-3 py-1.5 rounded-full border transition-all ${
        selected
          ? "border-[#b57e04] bg-[#b57e04]/10 text-[#b57e04]"
          : "border-border text-muted-foreground hover:border-[#b57e04]/50 hover:text-foreground"
      }`}
    >
      {selected && <CheckCircle className="w-3 h-3" />}
      {label}
    </button>
  );
}

function Chip({
  label, selected, onClick, disabled,
}: { label: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-xs font-ui font-medium border transition-all ${
        selected
          ? "bg-[#b57e04] border-[#b57e04] text-white"
          : disabled
          ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
          : "border-border text-foreground hover:border-[#b57e04] hover:text-[#b57e04]"
      }`}
    >
      {label}
    </button>
  );
}

function SegBtn({
  label, sub, selected, onClick,
}: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-center transition-all ${
        selected
          ? "border-[#b57e04] bg-[#b57e04]/10 text-[#b57e04]"
          : "border-border bg-card text-foreground hover:border-[#b57e04]/50"
      }`}
    >
      <p className="text-sm font-ui font-medium">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 font-ui">{sub}</p>}
    </button>
  );
}

function Stepper({
  value, min, max, onChange,
}: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:border-[#b57e04] hover:text-[#b57e04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-7 text-center font-ui font-bold text-foreground">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:border-[#b57e04] hover:text-[#b57e04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

const INPUT_CLS =
  "w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-ui focus:outline-none focus:ring-2 focus:ring-[#b57e04]";

// ─── Auth Dialog ──────────────────────────────────────────────────────────────

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");
  const supabase = getBrowserClient();

  const REDIRECT_BACK =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/create-perfect-travel-itinerary-and-planning")}`
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
            Your trip details are saved. Sign in and we&apos;ll submit automatically.
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
  service, selected, onSelect,
}: { service: InhouseService; selected: boolean; onSelect: () => void }) {
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
          <Badge className={`${GOLD_BTN} text-xs px-3 py-0.5 border-0`}>Most Popular</Badge>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
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

      {service.perfectFor.length > 0 && (
        <div className={`rounded-xl px-3 py-2.5 text-xs font-ui ${
          selected ? "bg-[#b57e04]/10 border border-[#b57e04]/20" : "bg-muted/50 border border-border"
        }`}>
          <span className={`font-semibold ${selected ? "text-[#b57e04]" : "text-foreground"}`}>Best for: </span>
          <span className="text-muted-foreground">{service.perfectFor.join(", ")}</span>
        </div>
      )}

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

// ─── Order Success ────────────────────────────────────────────────────────────

function OrderSuccessScreen({
  contractId, priceCents, packageName,
}: { contractId: string; priceCents: number; packageName: string }) {
  const router = useRouter();
  return (
    <Card className="gradient-border-card bg-card max-w-lg mx-auto">
      <CardContent className="p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-foreground font-display font-bold text-2xl mb-1">Order placed!</h2>
          <p className="text-muted-foreground font-ui text-sm">
            Your <span className="text-foreground font-medium">{packageName}</span> order is confirmed.
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

export default function CreateTravelItineraryContent() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();

  const [selectedService, setSelectedService] = useState<InhouseService | null>(null);
  const [form, setForm] = useState<TravelFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const [successData, setSuccessData] = useState<{
    contractId: string; priceCents: number; packageName: string;
  } | null>(null);

  const draftServiceIdRef = useRef<string | null>(null);
  const formRef = useRef(form);
  const selectedServiceRef = useRef(selectedService);

  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

  const setField = useCallback(
    <K extends keyof TravelFormState>(key: K, value: TravelFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const { data: services, isLoading: servicesLoading, isError: servicesError } = useQuery({
    queryKey: ["inhouse-services", "create-travel-itinerary"],
    queryFn: () => api.getInhouseServices("create-travel-itinerary"),
    staleTime: 5 * 60 * 1000,
  });

  // Restore selected service from draft
  useEffect(() => {
    if (services && draftServiceIdRef.current) {
      const match = services.find((s) => s.id === draftServiceIdRef.current);
      if (match) setSelectedService(match);
      draftServiceIdRef.current = null;
    }
  }, [services]);

  // Default to highlighted package
  useEffect(() => {
    if (services && !selectedService && !draftServiceIdRef.current) {
      const highlighted = services.find((s) => s.isHighlighted) ?? services[0];
      if (highlighted) setSelectedService(highlighted);
    }
  }, [services, selectedService]);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (!draft?.pendingSubmit) return;
    if (draft.serviceId) draftServiceIdRef.current = draft.serviceId;
    if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
    clearDraft();
    setPendingAutoSubmit(true);
  }, []);

  const submitOrder = useCallback(
    async (service: InhouseService, formData: TravelFormState) => {
      setSubmitting(true);
      try {
        const isPremium = service.packageName.toLowerCase().includes("premium");
        const buyerInputs = buildBuyerInputs(formData, isPremium);
        const description = buildDescription(formData, service, isPremium);

        const res = await api.createInhouseOrder({
          serviceId: service.id,
          buyerInputs,
          description,
        });

        setSuccessData({
          contractId: res.contract.id,
          priceCents: service.priceCents,
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

  // Auto-submit after redirect from auth
  useEffect(() => {
    if (pendingAutoSubmit && !userLoading && user && selectedServiceRef.current) {
      setPendingAutoSubmit(false);
      submitOrder(selectedServiceRef.current, formRef.current);
    }
  }, [pendingAutoSubmit, userLoading, user, submitOrder]);

  const handleSubmit = async () => {
    if (!selectedService) {
      toast({ title: "Pick a package", description: "Please select a package to continue", variant: "destructive" });
      return;
    }
    if (!form.destination.trim()) {
      toast({ title: "Add a destination", description: "Please tell us where you're traveling to", variant: "destructive" });
      return;
    }
    if (!user) {
      saveDraft({ serviceId: selectedService.id, form, pendingSubmit: true });
      setShowAuth(true);
      return;
    }
    submitOrder(selectedService, form);
  };

  const toggleChip = useCallback(
    (field: "tripTypes" | "interests" | "foodRestrictions", value: string) => {
      setForm((prev) => {
        const arr = prev[field] as string[];
        return {
          ...prev,
          [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
        };
      });
    },
    [],
  );

  const isPremium = selectedService?.packageName.toLowerCase().includes("premium") ?? false;
  const today = new Date().toISOString().split("T")[0];

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <OrderSuccessScreen
          contractId={successData.contractId}
          priceCents={successData.priceCents}
          packageName={successData.packageName}
        />
      </div>
    );
  }

  return (
    <>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 rounded-full px-4 py-1.5 text-sm font-ui font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fixed price · AI-powered · Escrow-protected
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
            Plan Your{" "}
            <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
              Perfect Trip
            </span>
          </h1>
          <p className="text-muted-foreground font-ui text-lg leading-relaxed">
            Get a personalized, day-by-day travel plan tailored to your style, budget, and
            interests — from a smart travel plan to a fully book-ready itinerary.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm font-ui text-muted-foreground">
            {[
              "Personalized day-by-day plan",
              "Escrow-protected payment",
              "Fast delivery",
              "Revisions included",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#b57e04]" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Step 1: Package ───────────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeader
            step={1}
            title="Select Your Package"
            subtitle="Fixed price — no hidden fees. Choose the tier that fits your trip."
          />

          {servicesLoading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {[1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : servicesError || !services || services.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground font-ui text-sm">
                {servicesError ? "Couldn't load packages. Please refresh the page." : "This service is temporarily unavailable."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5 items-start">
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

        {/* ── Step 2: Where & When ──────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeader
            step={2}
            title="Where & When"
            subtitle="Tell us your destination and travel dates"
          />

          {/* Destination */}
          <div className="space-y-1.5">
            <Label className="font-ui text-foreground text-sm font-medium">
              Destination <span className="text-destructive">*</span>
            </Label>
            <div className="relative max-w-md">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. Paris, France  ·  Southeast Asia  ·  New York"
                value={form.destination}
                onChange={(e) => setField("destination", e.target.value)}
                className={`pl-9 ${INPUT_CLS}`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-md">
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium">
                Start date <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <input
                type="date"
                min={today}
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium">
                End date <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <input
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <ToggleChip
            label="Flexible with dates"
            selected={form.flexibleDates}
            onToggle={() => setField("flexibleDates", !form.flexibleDates)}
          />

          {/* Travelers */}
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <div className="flex items-center gap-3">
              <Label className="font-ui text-foreground text-sm font-medium">Adults</Label>
              <Stepper value={form.adults} min={1} max={20} onChange={(v) => setField("adults", v)} />
            </div>
            <ToggleChip
              label="Traveling with kids"
              selected={form.hasKids}
              onToggle={() => setField("hasKids", !form.hasKids)}
            />
          </div>

          {form.hasKids && (
            <div className="pl-4 border-l-2 border-[#b57e04]/30 space-y-3">
              <div className="flex items-center gap-3">
                <Label className="font-ui text-foreground text-sm font-medium">Kids</Label>
                <Stepper value={form.kidCount} min={1} max={10} onChange={(v) => setField("kidCount", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-ui text-foreground text-sm font-medium">
                  Ages <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <input
                  type="text"
                  placeholder="e.g. 4, 8, 12"
                  value={form.kidAges}
                  onChange={(e) => setField("kidAges", e.target.value)}
                  className={`max-w-[180px] ${INPUT_CLS}`}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Step 3: Trip Style ────────────────────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            step={3}
            title="Your Trip Style"
            subtitle="Help us understand the vibe you're going for"
          />

          {/* Budget */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">Budget</Label>
            <div className="flex gap-3 max-w-md">
              {(["Budget", "Mid-range", "Luxury"] as const).map((b) => (
                <SegBtn
                  key={b}
                  label={b}
                  selected={form.budget === b}
                  onClick={() => setField("budget", b)}
                />
              ))}
            </div>
          </div>

          {/* Trip type */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">
              Type of trip <span className="text-muted-foreground font-normal">(select all that apply)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {TRIP_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={form.tripTypes.includes(t)}
                  onClick={() => toggleChip("tripTypes", t)}
                />
              ))}
            </div>
          </div>

          {/* Pace */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">Preferred pace</Label>
            <div className="flex gap-3 max-w-lg">
              {[
                { label: "Relaxed", sub: "Few activities/day" },
                { label: "Balanced", sub: "Good mix" },
                { label: "Fast-paced", sub: "See as much as possible" },
              ].map(({ label, sub }) => (
                <SegBtn
                  key={label}
                  label={label}
                  sub={sub}
                  selected={form.pace === label}
                  onClick={() => setField("pace", label)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Step 4: Interests ─────────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeader
            step={4}
            title="Interests & Wishlist"
            subtitle="What do you love doing on a trip?"
          />

          {/* Interests chips */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">
              Top interests{" "}
              <span className="text-muted-foreground font-normal">
                (pick up to {MAX_INTERESTS} — {MAX_INTERESTS - form.interests.length} remaining)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((item) => {
                const isSelected = form.interests.includes(item);
                const atMax = form.interests.length >= MAX_INTERESTS;
                return (
                  <Chip
                    key={item}
                    label={item}
                    selected={isSelected}
                    disabled={!isSelected && atMax}
                    onClick={() => toggleChip("interests", item)}
                  />
                );
              })}
            </div>
          </div>

          {/* Must-visit */}
          <div className="space-y-1.5">
            <Label className="font-ui text-foreground text-sm font-medium">
              Must-visit places or experiences{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <input
              type="text"
              placeholder="e.g. Eiffel Tower, local food market, sunset cruise"
              value={form.mustVisit}
              onChange={(e) => setField("mustVisit", e.target.value)}
              className={`max-w-lg ${INPUT_CLS}`}
            />
          </div>

          {/* Avoid — expandable */}
          {!form.showAvoid ? (
            <button
              type="button"
              onClick={() => setField("showAvoid", true)}
              className="text-xs font-ui text-muted-foreground hover:text-[#b57e04] transition-colors"
            >
              + Add places or things you want to avoid (optional)
            </button>
          ) : (
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium">
                Anything you want to avoid{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <input
                type="text"
                placeholder="e.g. crowded tourist traps, long bus rides"
                value={form.avoid}
                onChange={(e) => setField("avoid", e.target.value)}
                className={`max-w-lg ${INPUT_CLS}`}
              />
            </div>
          )}
        </section>

        {/* ── Step 5: Food ──────────────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeader
            step={5}
            title="Food Preferences"
            subtitle="Optional — helps us tailor restaurant and food recommendations"
          />

          {/* Restrictions */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">
              Dietary requirements{" "}
              <span className="text-muted-foreground font-normal">(select any that apply — leave blank for no restrictions)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_RESTRICTIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={form.foodRestrictions.includes(r)}
                  onClick={() => toggleChip("foodRestrictions", r)}
                />
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label className="font-ui text-foreground text-sm font-medium">Food experience preference</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_EXPERIENCES.map((e) => (
                <SegBtn
                  key={e}
                  label={e}
                  selected={form.foodExperience === e}
                  onClick={() => setField("foodExperience", e)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Premium: Stay & Plan Context ──────────────────────────────────── */}
        {isPremium && (
          <section className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-foreground font-display font-semibold text-xl">
                    Stay & Plan Context
                  </h2>
                  <Badge className={`${GOLD_BTN} text-xs px-2.5 py-0.5 border-0`}>
                    Premium
                  </Badge>
                </div>
                <p className="text-muted-foreground font-ui text-sm">
                  These details help us give you book-ready hotel, flight, and booking recommendations
                </p>
              </div>
            </div>

            {/* Departure city */}
            <div className="space-y-1.5">
              <Label className="font-ui text-foreground text-sm font-medium">
                Departing from{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative max-w-sm">
                <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. London, UK"
                  value={form.departureCity}
                  onChange={(e) => setField("departureCity", e.target.value)}
                  className={`pl-9 ${INPUT_CLS}`}
                />
              </div>
            </div>

            {/* Accommodation */}
            <div className="space-y-2">
              <Label className="font-ui text-foreground text-sm font-medium">
                Accommodation preference{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {ACCOMMODATIONS.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    selected={form.accommodation === a}
                    onClick={() =>
                      setField("accommodation", form.accommodation === a ? "" : a)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Travel purpose */}
            <div className="space-y-2">
              <Label className="font-ui text-foreground text-sm font-medium">
                Travel purpose{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_PURPOSES.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={form.travelPurpose === p}
                    onClick={() =>
                      setField("travelPurpose", form.travelPurpose === p ? "" : p)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Visa guidance */}
            <ToggleChip
              label="I need visa guidance for this trip"
              selected={form.visaGuidance}
              onToggle={() => setField("visaGuidance", !form.visaGuidance)}
            />
          </section>
        )}

        {/* ── Step 6: Anything Else ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader
            step={6}
            title="Anything Else?"
            subtitle="Optional — the more context you share, the better the itinerary"
          />
          <Textarea
            placeholder="e.g. We're celebrating our anniversary so something romantic would be perfect. We love architecture and local markets but prefer to avoid overly touristy spots. Our budget is flexible for special experiences."
            value={form.additionalNotes}
            onChange={(e) => setField("additionalNotes", e.target.value)}
            className="resize-none min-h-[120px] focus-visible:ring-[#b57e04] font-ui text-sm max-w-2xl"
          />
          <p className="text-xs text-muted-foreground font-ui">
            Don&apos;t worry about leaving fields blank — if we need more details, we&apos;ll ask you directly in the chat.
          </p>
        </section>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="w-full lg:max-w-[480px] lg:mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedService}
              className={`w-full h-12 text-base gap-2 ${GOLD_BTN}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Placing order...
                </>
              ) : !selectedService ? (
                "Select a Package to Continue"
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Order {selectedService.packageName} — ${(selectedService.priceCents / 100).toFixed(0)}
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
              What Makes a Great Travel Itinerary?
            </h2>
            <p className="text-muted-foreground font-ui leading-relaxed">
              A great travel itinerary isn&apos;t just a list of places — it&apos;s a thoughtfully
              structured day-by-day plan that balances your interests, energy, local logistics, and
              budget. Our AI agents combine destination expertise with your personal preferences to
              create plans that feel handcrafted, not generated. Whether you&apos;re planning a
              romantic getaway, a family adventure, or a solo expedition, every itinerary is built
              around you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-foreground font-display font-semibold text-lg mb-3">
                What You Get
              </h3>
              <ul className="space-y-2">
                {[
                  "Day-by-day schedule (time & location flow)",
                  "Must-visit sights and hidden gems",
                  "Activity recommendations for your interests",
                  "Food & local dining suggestions",
                  "Curated hotel options by budget & style (Premium)",
                  "Flight route & timing suggestions (Premium)",
                  "Local transport guidance (Premium)",
                  "Booking links for hotels, flights & activities (Premium)",
                  "Budget breakdown & cost estimates (Premium)",
                  "Visa, packing & local travel tips (Premium)",
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
                    { step: "1", title: "Pick your plan", desc: "Basic (smart itinerary) or Premium (fully book-ready)." },
                    { step: "2", title: "Tell us about your trip", desc: "Destination, dates, travelers, interests, and vibe." },
                    { step: "3", title: "Pay securely", desc: "Funds held in escrow — released only on your approval." },
                    { step: "4", title: "Agent gets to work", desc: "Your personalized itinerary is built and delivered in 1–2 days." },
                    { step: "5", title: "Review & approve", desc: "Request any changes, then approve to release payment." },
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
                    "Personalized to your interests, not a template",
                    "Covers any destination worldwide",
                    "From weekend trips to month-long adventures",
                    "Upgrade to Premium for a fully book-ready plan",
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
