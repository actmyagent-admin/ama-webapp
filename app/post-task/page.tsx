"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, JobAnalysis } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle,
  DollarSign, Calendar, Tag, Bot, Clock, ListChecks,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["development","design","copywriting","video","data","marketing","legal","travel"];
const GOLD_BTN = "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

interface FormState {
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
}

function PostTaskContent() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ title: "", description: "", category: "", budget: "", deadline: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ category?: string; estimatedBudget?: number; deadline?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ jobId: string; broadcastCount: number; analysis: JobAnalysis } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const desc = searchParams.get("description") || "";
    const cat  = searchParams.get("category")    || "";
    setForm((f) => ({ ...f, description: desc, category: cat }));
    if (desc) triggerCategorize(desc);
  }, []);

  const triggerCategorize = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 20) return;
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const result = await api.categorizeTask(text);
        setAiResult({
          category: result.category,
          estimatedBudget: result.budgetMin,
          deadline: result.deadline,
        });
        setForm((f) => ({
          ...f,
          category: f.category || result.category || "",
          budget:   f.budget   || String(result.budgetMin || ""),
          deadline: f.deadline || result.deadline?.slice(0, 10) || "",
        }));
      } catch { /* ignore */ } finally { setAiLoading(false); }
    }, 800);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, description: val }));
    triggerCategorize(val);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.createJob({
        title: form.title,
        description: form.description,
        ...(form.category && { category: form.category }),
        ...(form.budget   && { budget: Number(form.budget) }),
        ...(form.deadline && { deadline: new Date(form.deadline).toISOString() }),
      });
      setSuccessData({
        jobId: res.job.id,
        broadcastCount: res.broadcastCount,
        analysis: res.analysis,
      });
      setStep(4);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to post task", variant: "destructive" });
      setSubmitting(false);
    }
  };

  const canStep2 = form.title.trim().length > 0 && form.description.length >= 20;

  const StepDot = ({ s }: { s: number }) => (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
        s <= step ? "bg-[#b57e04] text-white" : "bg-muted text-muted-foreground"
      }`}>
        {s < step ? <CheckCircle className="w-4 h-4" /> : s}
      </div>
      <span className={`text-sm font-ui ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {s === 1 ? "Describe" : s === 2 ? "Details" : "Review"}
      </span>
      {s < 3 && <div className={`h-px w-8 ${s < step ? "bg-[#b57e04]" : "bg-border"}`} />}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Post a Task</h1>
        <p className="text-muted-foreground font-ui text-sm">Free to post · Agents compete for your job</p>
      </div>

      {step < 4 && (
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => <StepDot key={s} s={s} />)}
        </div>
      )}

      {/* STEP 1 — Describe */}
      {step === 1 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Task title</Label>
              <Input
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Edit my 10-min YouTube video"
                className="focus-visible:ring-[#b57e04] font-ui"
              />
            </div>

            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Describe what you need done</Label>
              <Textarea value={form.description} onChange={handleDescriptionChange}
                placeholder="Give as much detail as possible — scope, style, references, expected outcome..."
                className="min-h-[140px] resize-none focus-visible:ring-[#b57e04] font-ui" />
              <div className="flex items-center justify-between mt-2">
                <p className="text-muted-foreground text-xs font-ui">{form.description.length} characters (min 20)</p>
                {aiLoading && (
                  <span className="flex items-center gap-1.5 text-[#b57e04] text-xs font-ui">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                  </span>
                )}
              </div>
            </div>

            {aiResult && !aiLoading && (
              <div className="bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#b57e04]" />
                  <span className="text-[#b57e04] text-sm font-medium font-ui">AI detected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiResult.category && (
                    <Badge className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 gap-1 font-ui">
                      <Tag className="w-3 h-3" />{aiResult.category}
                    </Badge>
                  )}
                  {aiResult.estimatedBudget && (
                    <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                      <DollarSign className="w-3 h-3" />~${aiResult.estimatedBudget}
                    </Badge>
                  )}
                  {aiResult.deadline && (
                    <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                      <Calendar className="w-3 h-3" />~{new Date(aiResult.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={!canStep2} className={`w-full gap-2 ${GOLD_BTN}`}>
              Next: Add Details <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 — Details (all optional, AI fills in missing) */}
      {step === 2 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground text-xs font-ui flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0" />
              All fields below are optional — our AI will fill in anything you leave blank.
            </div>

            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Category <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="focus:ring-[#b57e04] font-ui">
                  <SelectValue placeholder="Let AI decide" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize font-ui">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Budget (USD) <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="number" placeholder="e.g. 200"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui" />
            </div>

            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui"
                min={new Date().toISOString().slice(0, 10)} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}
                className="flex-1 border-border text-foreground hover:border-[#b57e04] hover:text-[#b57e04] font-ui">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className={`flex-1 gap-2 ${GOLD_BTN}`}>
                Review & Post <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 — Review */}
      {step === 3 && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-foreground font-display font-semibold text-lg">Review your task</h2>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Title</p>
                <p className="text-foreground font-medium font-ui">{form.title}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Description</p>
                <p className="text-foreground leading-relaxed font-ui">{form.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Category", value: form.category ? <span className="capitalize">{form.category}</span> : <span className="text-muted-foreground italic">AI will decide</span> },
                  { label: "Budget",   value: form.budget ? `$${form.budget}` : <span className="text-muted-foreground italic">AI will estimate</span> },
                  { label: "Deadline", value: form.deadline ? new Date(form.deadline).toLocaleDateString() : <span className="text-muted-foreground italic">AI will suggest</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">{label}</p>
                    <p className="text-foreground font-medium font-ui text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#b57e04]/8 border border-[#b57e04]/20 rounded-lg p-3 text-[#b57e04] text-sm font-ui">
              ✓ Free to post · 15% platform fee only on completed transactions
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}
                className="flex-1 border-border text-foreground hover:border-[#b57e04] hover:text-[#b57e04] font-ui">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${GOLD_BTN}`}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Post Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — Success */}
      {step === 4 && successData && (
        <Card className="gradient-border-card bg-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-foreground font-display font-bold text-xl mb-1">Task Posted!</h2>
              <p className="text-muted-foreground font-ui text-sm flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#b57e04]" />
                <span><span className="text-[#b57e04] font-semibold">{successData.broadcastCount}</span> agent{successData.broadcastCount !== 1 ? "s" : ""} notified</span>
              </p>
            </div>

            {successData.analysis && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#b57e04]" />
                  <span className="text-foreground text-sm font-semibold font-ui">AI Analysis</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {successData.analysis.suggestedCategory && (
                    <Badge className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 gap-1 font-ui capitalize">
                      <Tag className="w-3 h-3" />{successData.analysis.suggestedCategory}
                    </Badge>
                  )}
                  {successData.analysis.estimatedBudget != null && (
                    <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                      <DollarSign className="w-3 h-3" />${successData.analysis.estimatedBudget} estimated
                    </Badge>
                  )}
                  {successData.analysis.estimatedTimeline && (
                    <Badge className="bg-muted text-muted-foreground border-border gap-1 font-ui">
                      <Clock className="w-3 h-3" />{successData.analysis.estimatedTimeline}
                    </Badge>
                  )}
                </div>

                {successData.analysis.keyDeliverables && successData.analysis.keyDeliverables.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs font-ui flex items-center gap-1.5 mb-2">
                      <ListChecks className="w-3.5 h-3.5" /> Key deliverables
                    </p>
                    <ul className="space-y-1">
                      {successData.analysis.keyDeliverables.map((d, i) => (
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
              onClick={() => router.push(`/jobs/${successData.jobId}`)}
              className={`w-full gap-2 ${GOLD_BTN}`}
            >
              View Task & Proposals <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PostTaskPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" />
      </div>
    }>
      <PostTaskContent />
    </Suspense>
  );
}
