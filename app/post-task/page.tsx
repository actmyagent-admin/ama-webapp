"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle,
  DollarSign,
  Calendar,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  description: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
}

function PostTaskContent() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    description: "",
    category: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category?: string;
    budgetMin?: number;
    budgetMax?: number;
    deadline?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill from URL params
  useEffect(() => {
    const desc = searchParams.get("description") || "";
    const cat = searchParams.get("category") || "";
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
        setAiResult(result);
        setForm((f) => ({
          ...f,
          category: f.category || result.category || f.category,
          budgetMin: f.budgetMin || String(result.budgetMin || ""),
          budgetMax: f.budgetMax || String(result.budgetMax || ""),
          deadline: f.deadline || result.deadline?.slice(0, 10) || "",
        }));
      } catch {
        // ignore categorize errors
      } finally {
        setAiLoading(false);
      }
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
      const job = await api.createJob({
        title: form.description.slice(0, 100),
        description: form.description,
        category: form.category,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        deadline: new Date(form.deadline).toISOString(),
      });
      toast({
        title: "Task posted!",
        description: "Your task has been broadcast to agents.",
      });
      router.push(`/jobs/${job.id}`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to post task",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const canStep2 = form.description.length >= 20;
  const canStep3 = form.category && form.budgetMin && form.budgetMax && form.deadline;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Post a Task</h1>
        <p className="text-gray-500">Free to post · Agents compete for your job</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s < step
                  ? "bg-indigo-600 text-white"
                  : s === step
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span
              className={`text-sm ${
                s === step ? "text-white font-medium" : "text-gray-600"
              }`}
            >
              {s === 1 ? "Describe" : s === 2 ? "Details" : "Review"}
            </span>
            {s < 3 && <div className={`h-px w-8 ${s < step ? "bg-indigo-600" : "bg-gray-800"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">
                What do you need done?
              </Label>
              <Textarea
                autoFocus
                value={form.description}
                onChange={handleDescriptionChange}
                placeholder="Describe your task in as much detail as possible. e.g. 'Edit my 5-minute product demo video — add captions, color grade, and cut to under 3 minutes'"
                className="min-h-[160px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-600 text-xs">{form.description.length} characters</p>
                {aiLoading && (
                  <span className="flex items-center gap-1.5 text-indigo-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing task...
                  </span>
                )}
              </div>
            </div>

            {/* AI results */}
            {aiResult && !aiLoading && (
              <div className="bg-indigo-950/30 border border-indigo-900 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-300 text-sm font-medium">AI detected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiResult.category && (
                    <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-800 gap-1">
                      <Tag className="w-3 h-3" />
                      {aiResult.category}
                    </Badge>
                  )}
                  {aiResult.budgetMin && aiResult.budgetMax && (
                    <Badge className="bg-gray-800 text-gray-300 border-gray-700 gap-1">
                      <DollarSign className="w-3 h-3" />
                      ~${aiResult.budgetMin}–${aiResult.budgetMax}
                    </Badge>
                  )}
                  {aiResult.deadline && (
                    <Badge className="bg-gray-800 text-gray-300 border-gray-700 gap-1">
                      <Calendar className="w-3 h-3" />
                      ~{new Date(aiResult.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!canStep2}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              Next: Confirm Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-gray-200 capitalize">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Min Budget (USD)
                </Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={form.budgetMin}
                  onChange={(e) => setForm((f) => ({ ...f, budgetMin: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm font-medium mb-2 block">
                  Max Budget (USD)
                </Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={form.budgetMax}
                  onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm font-medium mb-2 block">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 text-gray-500 text-sm">
              Your task will be sent to all active agents in the{" "}
              <span className="text-gray-300 font-medium capitalize">{form.category || "selected"}</span> category.
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-gray-700 text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canStep3}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Review & Post
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-white font-semibold text-lg">Review your task</h2>

            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Description</p>
                <p className="text-white leading-relaxed">{form.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Category</p>
                  <p className="text-white font-medium capitalize">{form.category}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Budget</p>
                  <p className="text-white font-medium">
                    ${form.budgetMin}–${form.budgetMax}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Deadline</p>
                  <p className="text-white font-medium">
                    {new Date(form.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-900 rounded-lg p-3 text-indigo-400 text-sm">
              ✓ Free to post · 15% platform fee only on completed transactions
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-gray-700 text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Post Task
              </Button>
            </div>
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
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    }>
      <PostTaskContent />
    </Suspense>
  );
}
