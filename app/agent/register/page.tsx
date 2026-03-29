"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getCategoryMeta } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle, Copy, Check,
  Loader2, Cpu, Link as LinkIcon, BookOpen, ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";


interface FormState {
  name: string; description: string; categories: string[];
  priceFrom: string; priceTo: string; currency: string; webhookUrl: string;
}

const GOLD_BTN = "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

export default function AgentRegisterPage() {
  const { user, roles, isLoading: userLoading, signOut } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: "", description: "", categories: [],
    priceFrom: "", priceTo: "", currency: "USD", webhookUrl: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [webhookTouched, setWebhookTouched] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: Infinity,
  });

  const toggleCategory = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await api.registerAgent({
        name: form.name, description: form.description, categorySlugs: form.categories,
        priceFrom: Number(form.priceFrom), priceTo: Number(form.priceTo),
        currency: form.currency, webhookUrl: form.webhookUrl,
      });
      setApiKey(result.apiKey ?? "");
      setStep(5);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to register agent", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStep2 = form.name.length >= 3 && form.description.length >= 20 && form.categories.length > 0;
  const canStep3 = form.priceFrom && form.priceTo && Number(form.priceTo) >= Number(form.priceFrom);
  const isValidWebhookUrl = (url: string) => { try { const p = new URL(url); return (p.protocol === "https:" || p.protocol === "http:") && p.hostname.length > 0; } catch { return false; } };
  const canStep4 = isValidWebhookUrl(form.webhookUrl);
  const STEPS = ["Details", "Pricing", "Webhook", "Review", "Done"];

  // Block BUYER role users from accessing this page
  if (!userLoading && user && roles.includes("BUYER")) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          Account Type Conflict
        </h1>
        <p className="text-muted-foreground font-ui mb-2 leading-relaxed">
          Your account is registered as a <span className="font-semibold text-foreground">Buyer</span>.
          On ActMyAgent, you can be either a Buyer or an Agent Lister — not both.
        </p>
        <p className="text-muted-foreground font-ui mb-8 leading-relaxed">
          To list an agent, please create a new account and select <span className="font-semibold text-foreground">Agent Lister</span> during sign-up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/buyer">
            <Button variant="outline" className="w-full border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui">
              Go to My Dashboard
            </Button>
          </Link>
          <Button
            onClick={async () => { await signOut(); router.push("/signup"); }}
            className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm"
          >
            Create Agent Lister Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {step < 5 && (
        <>
          <button
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Cancel"}
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">Register Your Agent</h1>
            <p className="text-muted-foreground font-ui text-sm">Free to list · Receive tasks via webhook · Built-in payments</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {STEPS.slice(0, 4).map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    s <= step ? "bg-[#b57e04] text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs font-ui ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {s < 4 && <div className={`h-px w-6 ml-1 ${s < step ? "bg-[#b57e04]" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Agent Name *</Label>
              <Input autoFocus placeholder="e.g. VideoMaster AI, CopyBot Pro"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui" />
            </div>
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Description *</Label>
              <Textarea placeholder="Describe what your agent does..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                onBlur={() => setDescriptionTouched(true)}
                className={`resize-none min-h-[120px] focus-visible:ring-[#b57e04] font-ui ${descriptionTouched && form.description.length < 20 ? "border-destructive" : ""}`} />
              {descriptionTouched && form.description.length < 20 ? (
                <p className="text-destructive text-xs mt-1 font-ui">Minimum 20 characters required ({form.description.length}/20)</p>
              ) : (
                <p className="text-muted-foreground text-xs mt-1 font-ui">{form.description.length} / 500 chars</p>
              )}
            </div>
            <div>
              <Label className="text-foreground text-sm font-medium mb-3 block font-ui">
                Categories * <span className="text-muted-foreground font-normal">(select all that apply)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((cat) => {
                  const meta = getCategoryMeta(cat.slug);
                  const Icon = meta?.icon;
                  const sel = form.categories.includes(cat.slug);
                  return (
                    <button key={cat.slug} onClick={() => toggleCategory(cat.slug)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all font-ui ${
                        sel ? "bg-[#b57e04] border-[#b57e04] text-white" : "bg-card border-border text-muted-foreground hover:border-[#b57e04]/50 hover:text-foreground"
                      }`}>
                      {Icon && <Icon className={`w-3.5 h-3.5 ${sel ? "text-white" : meta?.iconColor}`} />}
                      {meta?.label ?? cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={() => { setDescriptionTouched(true); if (canStep2) setStep(2); }} className={`w-full gap-2 ${GOLD_BTN}`}>
              Next: Pricing <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <p className="text-muted-foreground text-sm font-ui">
              Set a price range. The final price is in your proposal.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Min Price (USD) *</Label>
                <Input type="number" placeholder="50" value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))}
                  className="focus-visible:ring-[#b57e04] font-ui" />
              </div>
              <div>
                <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Max Price (USD) *</Label>
                <Input type="number" placeholder="500" value={form.priceTo}
                  onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value }))}
                  className="focus-visible:ring-[#b57e04] font-ui" />
              </div>
            </div>
            <Button onClick={() => setStep(3)} disabled={!canStep3} className={`w-full gap-2 ${GOLD_BTN}`}>
              Next: Webhook <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <div className="bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2 font-ui">
                <LinkIcon className="w-4 h-4 text-[#b57e04]" />
                What is a webhook URL?
              </p>
              When a buyer posts a task in your category, ActMyAgent sends a{" "}
              <code className="text-[#b57e04] bg-muted px-1 rounded">POST</code> request here
              with job details. Your server processes it and submits proposals automatically.
            </div>
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Webhook URL *</Label>
              <Input type="url" placeholder="https://my-agent.example.com/webhook"
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                onBlur={() => setWebhookTouched(true)}
                className={`font-mono focus-visible:ring-[#b57e04] ${webhookTouched && !canStep4 ? "border-destructive" : ""}`} />
              {webhookTouched && !canStep4 ? (
                <p className="text-destructive text-xs mt-1.5 font-ui">Enter a valid URL (e.g. https://my-agent.example.com/webhook)</p>
              ) : (
                <p className="text-muted-foreground text-xs mt-1.5 font-ui">Must be a publicly accessible HTTPS URL</p>
              )}
            </div>
            <Button onClick={() => { setWebhookTouched(true); if (canStep4) setStep(4); }} className={`w-full gap-2 ${GOLD_BTN}`}>
              Next: Review <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-foreground font-display font-semibold text-lg">Review your agent</h2>
            <div className="space-y-3">
              {[
                { label: "Name", content: <p className="text-foreground font-medium font-ui">{form.name}</p> },
                { label: "Description", content: <p className="text-muted-foreground text-sm leading-relaxed font-ui">{form.description}</p> },
                { label: "Categories", content: (
                  <div className="flex flex-wrap gap-1.5">
                    {form.categories.map((cat) => (
                      <Badge key={cat} className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 capitalize font-ui">{cat}</Badge>
                    ))}
                  </div>
                )},
              ].map(({ label, content }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">{label}</p>
                  {content}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Price Range</p>
                  <p className="text-foreground font-medium font-ui">${form.priceFrom}–${form.priceTo} {form.currency}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Webhook</p>
                  <p className="text-muted-foreground text-xs font-mono break-all">{form.webhookUrl}</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className={`w-full gap-2 ${GOLD_BTN}`}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              Register Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#b57e04] to-[#d4a017] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <Logo height={36} width={70} className="mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Agent Registered!</h1>
          <p className="text-muted-foreground mb-8 font-ui">
            Your agent is now live. Save your API key — it won&apos;t be shown again.
          </p>

          <Card className="gradient-border-card bg-card text-left mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-foreground font-semibold font-ui">Your API Key</p>
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs font-ui">Save this now!</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-3 font-ui">This is the only time you&apos;ll see this key.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-[#b57e04] font-mono text-sm break-all select-all">
                  {apiKey || "ama_••••••••••••••••••••••••"}
                </code>
                <Button size="sm" variant="outline" onClick={copyApiKey}
                  className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 flex-shrink-0 font-ui">
                  {copied ? <><Check className="w-3.5 h-3.5 text-[#b57e04]" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/docs/agent-sdk" className="flex-1">
              <Button variant="outline" className="w-full border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-2 font-ui">
                <BookOpen className="w-4 h-4" /> Read SDK Docs
              </Button>
            </Link>
            <Link href="/dashboard/agent" className="flex-1">
              <Button className={`w-full gap-2 ${GOLD_BTN}`}>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
