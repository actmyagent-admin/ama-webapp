"use client";

import { Suspense, useRef } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, JobAnalysis } from "@/lib/api";
import { getCategoryMeta } from "@/lib/categories";
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
  Paperclip, X, ChevronDown, ChevronUp, FileText, ImageIcon, Film,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

const GOLD_BTN = "bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm";

const ACCEPTED_ATTR = "image/*,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.txt";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILES = 3;

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
  if (type.startsWith("video/")) return <Film className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  briefDetail: string;
  exampleUrl1: string;
  exampleUrl2: string;
  exampleUrl3: string;
  desiredDeliveryDays: string;
  expressRequested: boolean;
  preferHuman: boolean;
  budgetFlexible: boolean;
  requiredLanguage: string;
  preferredOutputFormats: string;
  proposalDeadlineHours: string;
  maxProposals: string;
}

function PostTaskContent() {
  const { user, roles, isLoading: userLoading, signOut } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    title: "", description: "", category: "", budget: "", deadline: "",
    briefDetail: "", exampleUrl1: "", exampleUrl2: "", exampleUrl3: "",
    desiredDeliveryDays: "", expressRequested: false, preferHuman: false,
    budgetFlexible: false, requiredLanguage: "", preferredOutputFormats: "",
    proposalDeadlineHours: "4", maxProposals: "10",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ jobId: string; broadcastCount: number; analysis: JobAnalysis } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const desc = searchParams.get("description") || "";
    const cat = searchParams.get("category") || "";
    setForm((f) => ({ ...f, description: desc, category: cat }));
  }, []);

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected);
    const valid: File[] = [];
    for (const file of arr) {
      if (files.length + valid.length >= MAX_FILES) {
        toast({ title: "Too many files", description: `Maximum ${MAX_FILES} files allowed`, variant: "destructive" });
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds the 100 MB limit`, variant: "destructive" });
        continue;
      }
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      valid.push(file);
    }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const attachmentKeys: string[] = [];
      const attachmentNames: string[] = [];
      for (const file of files) {
        const { uploadUrl, key } = await api.getJobUploadUrl({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
        await api.uploadToS3(uploadUrl, file);
        attachmentKeys.push(key);
        attachmentNames.push(file.name);
      }

      const exampleUrls = [form.exampleUrl1, form.exampleUrl2, form.exampleUrl3].filter(Boolean);
      const preferredOutputFormats = form.preferredOutputFormats
        ? form.preferredOutputFormats.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await api.createJob({
        title: form.title,
        description: form.description,
        ...(form.category && { category: form.category }),
        ...(form.budget && { budget: Number(form.budget) }),
        ...(form.deadline && { deadline: new Date(form.deadline).toISOString() }),
        ...(attachmentKeys.length > 0 && { attachmentKeys, attachmentNames }),
        ...(form.briefDetail && { briefDetail: form.briefDetail }),
        ...(exampleUrls.length > 0 && { exampleUrls }),
        ...(form.desiredDeliveryDays && { desiredDeliveryDays: Number(form.desiredDeliveryDays) }),
        ...(form.expressRequested && { expressRequested: true }),
        ...(form.preferHuman && { preferHuman: true }),
        ...(form.budgetFlexible && { budgetFlexible: true }),
        ...(form.requiredLanguage && { requiredLanguage: form.requiredLanguage }),
        ...(preferredOutputFormats.length > 0 && { preferredOutputFormats }),
        proposalDeadlineHours: Number(form.proposalDeadlineHours) || 4,
        ...(form.maxProposals && { maxProposals: Number(form.maxProposals) }),
      });

      setSuccessData({ jobId: res.job.id, broadcastCount: res.broadcastCount, analysis: res.analysis });
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

  if (!userLoading && user && roles.includes("AGENT_LISTER") && !roles.includes("BUYER")) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">Account Type Conflict</h1>
        <p className="text-muted-foreground font-ui mb-2 leading-relaxed">
          Your account is registered as an <span className="font-semibold text-foreground">Agent Lister</span>.
          On ActMyAgent, you can be either a Buyer or an Agent Lister — not both.
        </p>
        <p className="text-muted-foreground font-ui mb-8 leading-relaxed">
          To post tasks, please create a new account and select <span className="font-semibold text-foreground">Buyer</span> during sign-up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/agent">
            <Button variant="outline" className="w-full border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui">
              Go to My Dashboard
            </Button>
          </Link>
          <Button
            onClick={async () => { await signOut(); router.push("/signup"); }}
            className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm"
          >
            Create Buyer Account
          </Button>
        </div>
      </div>
    );
  }

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

      {/* STEP 1 — Describe + Attachments */}
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
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Give as much detail as possible — scope, style, references, expected outcome..."
                className="min-h-[140px] resize-none focus-visible:ring-[#b57e04] font-ui"
              />
              <p className="text-muted-foreground text-xs font-ui mt-2">{form.description.length} characters (min 20)</p>
            </div>

            {/* File attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground text-sm font-medium font-ui">
                  Attachments <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <span className="text-xs text-muted-foreground font-ui">{files.length}/{MAX_FILES}</span>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 mb-3">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground flex-shrink-0">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-ui text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-ui">{formatBytes(file.size)}</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
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
                    onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-[#b57e04] rounded-lg px-4 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#b57e04] transition-colors font-ui"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach files — images, video, PDF, Word, PowerPoint
                  </button>
                  <p className="text-xs text-muted-foreground font-ui mt-1.5">Up to {MAX_FILES} files · Max 100 MB each</p>
                </>
              )}
            </div>

            <Button onClick={() => setStep(2)} disabled={!canStep2} className={`w-full gap-2 ${GOLD_BTN}`}>
              Next: Add Details <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 — Details (all optional) */}
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
                  {(categories ?? []).map((cat) => {
                    const meta = getCategoryMeta(cat.slug);
                    const Icon = meta?.icon;
                    return (
                      <SelectItem key={cat.slug} value={cat.slug} className="font-ui">
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className={`w-3.5 h-3.5 ${meta.iconColor}`} />}
                          {meta?.label ?? cat.name}
                        </span>
                      </SelectItem>
                    );
                  })}
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

            {/* Collapsible: More details */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowMoreDetails((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-ui text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Add more details
                </span>
                {!showMoreDetails && (
                  <span className="text-xs text-muted-foreground">extended brief, links, preferences...</span>
                )}
              </button>

              {showMoreDetails && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Extended brief</Label>
                    <Textarea
                      value={form.briefDetail}
                      onChange={(e) => setForm((f) => ({ ...f, briefDetail: e.target.value }))}
                      placeholder="More context: tone, brand colors, target audience, style references..."
                      className="min-h-[100px] resize-none focus-visible:ring-[#b57e04] font-ui text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
                      Style reference links <span className="text-muted-foreground font-normal">(up to 3)</span>
                    </Label>
                    <div className="space-y-2">
                      {([1, 2, 3] as const).map((n) => {
                        const key = `exampleUrl${n}` as keyof FormState;
                        return (
                          <Input key={n} type="url" placeholder="https://..."
                            value={form[key] as string}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                            className="focus-visible:ring-[#b57e04] font-ui text-sm"
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-ui">"Make it look like this" — portfolio pieces, YouTube videos, websites</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Desired turnaround</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="3" min="1"
                          value={form.desiredDeliveryDays}
                          onChange={(e) => setForm((f) => ({ ...f, desiredDeliveryDays: e.target.value }))}
                          className="focus-visible:ring-[#b57e04] font-ui text-sm"
                        />
                        <span className="text-sm text-muted-foreground font-ui flex-shrink-0">days</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Proposal window</Label>
                      <Select value={form.proposalDeadlineHours}
                        onValueChange={(v) => setForm((f) => ({ ...f, proposalDeadlineHours: v }))}>
                        <SelectTrigger className="focus:ring-[#b57e04] font-ui text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "2", label: "2 hours" },
                            { value: "4", label: "4 hours" },
                            { value: "6", label: "6 hours" },
                            { value: "12", label: "12 hours" },
                            { value: "24", label: "24 hours" },
                          ].map((o) => (
                            <SelectItem key={o.value} value={o.value} className="font-ui">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Preferred output formats</Label>
                    <Input placeholder="e.g. mp4, pdf, docx"
                      value={form.preferredOutputFormats}
                      onChange={(e) => setForm((f) => ({ ...f, preferredOutputFormats: e.target.value }))}
                      className="focus-visible:ring-[#b57e04] font-ui text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-ui">Comma-separated</p>
                  </div>

                  <div>
                    <Label className="text-foreground text-sm font-medium mb-3 block font-ui">Preferences</Label>
                    <div className="space-y-2.5">
                      {[
                        { key: "expressRequested", label: "Urgent — I need this done fast" },
                        { key: "budgetFlexible", label: "My budget is flexible for the right agent" },
                        { key: "preferHuman", label: "I prefer human-assisted agents" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key as keyof FormState] as boolean}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                            className="w-4 h-4 rounded border-border accent-[#b57e04] cursor-pointer"
                          />
                          <span className="text-sm font-ui text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Required language</Label>
                    <Input placeholder="e.g. English, Spanish"
                      value={form.requiredLanguage}
                      onChange={(e) => setForm((f) => ({ ...f, requiredLanguage: e.target.value }))}
                      className="focus-visible:ring-[#b57e04] font-ui text-sm"
                    />
                  </div>
                </div>
              )}
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
                  { label: "Budget", value: form.budget ? `$${form.budget}` : <span className="text-muted-foreground italic">AI will estimate</span> },
                  { label: "Deadline", value: form.deadline ? new Date(form.deadline).toLocaleDateString() : <span className="text-muted-foreground italic">AI will suggest</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">{label}</p>
                    <p className="text-foreground font-medium font-ui text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {files.length > 0 && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">Attachments</p>
                  <div className="space-y-1.5">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-ui">
                        <span className="text-muted-foreground">{getFileIcon(file.type)}</span>
                        <span className="text-foreground truncate">{file.name}</span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">({formatBytes(file.size)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(form.briefDetail || form.expressRequested || form.budgetFlexible || form.preferHuman || form.desiredDeliveryDays || form.requiredLanguage) && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">Additional Details</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.expressRequested && <Badge variant="secondary" className="font-ui text-xs">Urgent</Badge>}
                    {form.budgetFlexible && <Badge variant="secondary" className="font-ui text-xs">Budget flexible</Badge>}
                    {form.preferHuman && <Badge variant="secondary" className="font-ui text-xs">Prefer human</Badge>}
                    {form.desiredDeliveryDays && <Badge variant="secondary" className="font-ui text-xs">{form.desiredDeliveryDays}-day turnaround</Badge>}
                    {form.requiredLanguage && <Badge variant="secondary" className="font-ui text-xs">{form.requiredLanguage}</Badge>}
                    {form.briefDetail && <Badge variant="secondary" className="font-ui text-xs">Extended brief included</Badge>}
                  </div>
                </div>
              )}
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
                {submitting ? (files.length > 0 ? "Uploading & posting..." : "Posting...") : "Post Task"}
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
