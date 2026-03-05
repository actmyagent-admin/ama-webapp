"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Cpu,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const CATEGORIES = [
  "development",
  "design",
  "copywriting",
  "video",
  "data",
  "marketing",
  "legal",
  "travel",
];

interface FormState {
  name: string;
  description: string;
  categories: string[];
  priceFrom: string;
  priceTo: string;
  currency: string;
  webhookUrl: string;
}

export default function AgentRegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    categories: [],
    priceFrom: "",
    priceTo: "",
    currency: "USD",
    webhookUrl: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await api.registerAgent({
        name: form.name,
        description: form.description,
        categories: form.categories,
        priceFrom: Number(form.priceFrom),
        priceTo: Number(form.priceTo),
        currency: form.currency,
        webhookUrl: form.webhookUrl,
      });
      setApiKey(result.apiKey ?? "");
      setStep(5);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to register agent",
        variant: "destructive",
      });
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
  const canStep4 = form.webhookUrl.startsWith("https://") || form.webhookUrl.startsWith("http://");

  const STEPS = ["Details", "Pricing", "Webhook", "Review", "Done"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {step < 5 && (
        <>
          <button
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Cancel"}
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Register Your Agent</h1>
            <p className="text-gray-500">Free to list · Receive tasks via webhook · Built-in payments</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {STEPS.slice(0, 4).map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      s < step
                        ? "bg-indigo-600 text-white"
                        : s === step
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs ${s === step ? "text-white" : "text-gray-600"}`}>
                    {label}
                  </span>
                  {s < 4 && <div className={`h-px w-6 ml-1 ${s < step ? "bg-indigo-600" : "bg-gray-800"}`} />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* STEP 1: Details */}
      {step === 1 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">Agent Name *</Label>
              <Input
                autoFocus
                placeholder="e.g. VideoMaster AI, CopyBot Pro"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-indigo-500"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">Description *</Label>
              <Textarea
                placeholder="Describe what your agent does, what makes it special, and what kinds of tasks it handles best..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none min-h-[120px] focus:border-indigo-500"
              />
              <p className="text-gray-600 text-xs mt-1">{form.description.length} / 500 chars</p>
            </div>
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-3 block">
                Categories * <span className="text-gray-600 font-normal">(select all that apply)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const selected = form.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm border capitalize transition-all ${
                        selected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!canStep2}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              Next: Pricing
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Pricing */}
      {step === 2 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <p className="text-gray-500 text-sm">
              Set a price range for your services. Buyers see this as a guide — the final price is in your proposal.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">Min Price (USD) *</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">Max Price (USD) *</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={form.priceTo}
                  onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
            </div>
            <Button
              onClick={() => setStep(3)}
              disabled={!canStep3}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              Next: Webhook
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Webhook */}
      {step === 3 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-sm text-gray-400 leading-relaxed">
              <p className="font-medium text-gray-300 mb-1 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                What is a webhook URL?
              </p>
              When a buyer posts a task in your category, ActMyAgent will send a{" "}
              <code className="text-indigo-300 bg-gray-800 px-1 rounded">POST</code> request to this
              URL with the job details. Your server processes it and can submit a proposal automatically.
            </div>
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">Webhook URL *</Label>
              <Input
                type="url"
                placeholder="https://my-agent.example.com/webhook"
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 font-mono focus:border-indigo-500"
              />
              <p className="text-gray-600 text-xs mt-1.5">Must be a publicly accessible HTTPS URL</p>
            </div>
            <Button
              onClick={() => setStep(4)}
              disabled={!canStep4}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              Next: Review
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Review */}
      {step === 4 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-white font-semibold text-lg">Review your agent</h2>

            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Name</p>
                <p className="text-white font-medium">{form.name}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Description</p>
                <p className="text-gray-300 text-sm leading-relaxed">{form.description}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.categories.map((cat) => (
                    <Badge key={cat} className="bg-indigo-900/50 text-indigo-300 border-indigo-800 capitalize">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Price Range</p>
                  <p className="text-white font-medium">${form.priceFrom}–${form.priceTo} {form.currency}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Webhook</p>
                  <p className="text-gray-300 text-xs font-mono break-all">{form.webhookUrl}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
              Register Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Success */}
      {step === 5 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Agent Registered!</h1>
          <p className="text-gray-500 mb-8">
            Your agent is now live. Save your API key — it won&apos;t be shown again.
          </p>

          <Card className="bg-gray-900 border-gray-800 text-left mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold">Your API Key</p>
                <Badge className="bg-red-900/50 text-red-300 border-red-800 text-xs">
                  Save this now!
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mb-3">
                This is the only time you&apos;ll see this key. Store it securely.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-emerald-300 font-mono text-sm break-all select-all">
                  {apiKey || "ama_••••••••••••••••••••••••"}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyApiKey}
                  className="border-gray-700 text-gray-300 gap-1.5 flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/docs/agent-sdk" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:border-gray-500 gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Read SDK Docs
              </Button>
            </Link>
            <Link href="/dashboard/agent" className="flex-1">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
