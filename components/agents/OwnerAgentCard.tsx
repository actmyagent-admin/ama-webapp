"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  Briefcase,
  RefreshCw,
  Pencil,
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  AlertTriangle,
  KeyRound,
  Camera,
  Download,
  LayoutList,
} from "lucide-react";
import { AgentProfile, AgentCategory, api } from "@/lib/api";
import { downloadSkillMd } from "@/lib/downloadSkill";
import { getCategoryMeta, FALLBACK_BADGE_CLASS } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { getBrowserClient } from "@/lib/supabase";

const BUCKET = "profile-pics";

interface OwnerAgentCardProps {
  agent: AgentProfile;
  stripeConnected?: boolean;
  categories?: AgentCategory[];
}

interface EditForm {
  name: string;
  description: string;
  priceFrom: string;
  priceTo: string;
  webhookUrl: string;
  categorySlugs: string[];
}

export function OwnerAgentCard({ agent, stripeConnected, categories }: OwnerAgentCardProps) {
  const initials = agent.name.slice(0, 2).toUpperCase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const picInputRef = useRef<HTMLInputElement>(null);
  const coverPicInputRef = useRef<HTMLInputElement>(null);

  const [confirmRotateOpen, setConfirmRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [downloadingSkill, setDownloadingSkill] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState<"main" | "cover" | null>(null);
  const [localMainPic, setLocalMainPic] = useState<string | null>(agent.mainPic ?? null);
  const [localCoverPic, setLocalCoverPic] = useState<string | null>(agent.coverPic ?? null);
  const [form, setForm] = useState<EditForm>({
    name: agent.name,
    description: agent.description,
    priceFrom: String(agent.priceFrom),
    priceTo: String(agent.priceTo),
    webhookUrl: agent.webhookUrl ?? "",
    categorySlugs: agent.categories.map((c) => c.slug),
  });

  const uploadAgentPic = async (file: File, type: "main" | "cover") => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }
    setUploadingPic(type);
    try {
      const supabase = getBrowserClient();
      const path = `${user.id}/${agent.id}/${type}-pic`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const field = type === "main" ? "mainPic" : "coverPic";
      if (type === "main") setLocalMainPic(url);
      else setLocalCoverPic(url);
      await api.updateAgent(agent.id, { [field]: url });
      queryClient.setQueryData(["me"], (old: any) => {
        if (!old?.agentProfiles) return old;
        return {
          ...old,
          agentProfiles: old.agentProfiles.map((a: AgentProfile) =>
            a.id === agent.id ? { ...a, [field]: url } : a
          ),
        };
      });
      toast({ title: type === "main" ? "Agent photo updated" : "Cover photo updated", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploadingPic(null);
    }
  };

  const displayKey = newApiKey
    ? newApiKey
    : agent.apiKeyPrefix
    ? `${agent.apiKeyPrefix}••••••••••••••••••••`
    : "ama_••••••••••••••••••••••••••••••••";

  const handleRotateConfirmed = async () => {
    setConfirmRotateOpen(false);
    setRotating(true);
    try {
      const res = await api.regenerateKey(agent.id);
      setNewApiKey(res.apiKey);
      setNewWebhookSecret(res.webhookSecret ?? null);
      setNewKeyModalOpen(true);
    } catch {
      toast({ title: "Failed to rotate key", variant: "destructive" });
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newApiKey ?? displayKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [categorySearch, setCategorySearch] = useState("");

  const toggleCategory = (slug: string) =>
    setForm((f) => {
      if (f.categorySlugs.includes(slug)) {
        return { ...f, categorySlugs: f.categorySlugs.filter((s) => s !== slug) };
      }
      if (f.categorySlugs.length >= 3) return f;
      return { ...f, categorySlugs: [...f.categorySlugs, slug] };
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateAgent(agent.id, {
        name: form.name,
        description: form.description,
        priceFrom: Number(form.priceFrom),
        priceTo: Number(form.priceTo),
        webhookUrl: form.webhookUrl,
        categorySlugs: form.categorySlugs,
        mainPic: localMainPic,
        coverPic: localCoverPic,
      });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditOpen(false);
      toast({ title: "Agent updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update agent", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setLocalMainPic(agent.mainPic ?? null);
    setLocalCoverPic(agent.coverPic ?? null);
    setForm({
      name: agent.name,
      description: agent.description,
      priceFrom: String(agent.priceFrom),
      priceTo: String(agent.priceTo),
      webhookUrl: agent.webhookUrl ?? "",
      categorySlugs: agent.categories.map((c) => c.slug),
    });
    setEditOpen(true);
  };

  return (
    <>
      <Card className="gradient-border-card bg-card hover:shadow-md transition-all duration-200">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-11 h-11 flex-shrink-0">
              {(agent.mainPic ?? agent.avatarUrl) ? (
                <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <Link href={`/agents/${agent.slug ?? agent.id}`}>
                <h3 className="text-foreground font-semibold truncate hover:text-[#b57e04] transition-colors font-ui">
                  {agent.name}
                </h3>
              </Link>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {agent.avgRating != null && (
                  <span className="flex items-center gap-1 text-amber-500 text-xs font-ui">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {agent.avgRating.toFixed(1)}
                  </span>
                )}
                {agent.totalJobs != null && (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs font-ui">
                    <Briefcase className="w-3 h-3" />
                    {agent.totalJobs} jobs
                  </span>
                )}
                {stripeConnected && agent.isActive ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-ui font-medium">
                    Active
                  </span>
                ) : !stripeConnected ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-ui">
                    Inactive
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-ui">
                    Paused
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Link href={`/my-agents/${agent.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1 font-ui"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  Activity
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={openEdit}
                className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1 font-ui"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed font-ui">
            {agent.description}
          </p>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.categories.slice(0, 3).map((cat) => (
              <span
                key={cat.id || cat.slug}
                className={`text-xs px-2 py-0.5 rounded border capitalize font-ui ${
                  getCategoryMeta(cat.slug)?.badgeClass ?? FALLBACK_BADGE_CLASS
                }`}
              >
                {cat.name}
              </span>
            ))}
            {agent.categories.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-ui">
                +{agent.categories.length - 3}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm font-ui">
              <span className="text-foreground font-semibold">
                ${agent.priceFrom}–${agent.priceTo}
              </span>{" "}
              {agent.currency ?? "USD"}
            </span>
          </div>

          {/* Webhook URL */}
          {agent.webhookUrl && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                {agent.webhookUrl}
              </span>
            </div>
          )}

          {/* API Key */}
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 bg-muted border border-border rounded-lg px-3 py-2 text-[#b57e04] font-mono text-xs truncate">
              {displayKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="flex-shrink-0 border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1 font-ui"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#b57e04]" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmRotateOpen(true)}
              disabled={rotating}
              className="flex-shrink-0 border-border hover:border-amber-500 hover:text-amber-500 gap-1 font-ui"
              title="Rotate API key"
            >
              {rotating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Cover + Avatar photos */}
            <div>
              <Label className="font-ui text-sm font-medium mb-2 block">Photos</Label>
              <div className="relative mb-10">
                {/* Cover photo */}
                <div
                  className="h-28 rounded-xl bg-gradient-to-br from-[#b57e04]/20 to-[#d4a017]/10 border border-border overflow-hidden relative group cursor-pointer"
                  onClick={() => coverPicInputRef.current?.click()}
                >
                  {localCoverPic ? (
                    <Image src={localCoverPic} alt="Cover" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-xs font-ui">Click to add cover photo</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingPic === "cover" ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <div className="flex items-center gap-1.5 text-white text-xs font-ui">
                        <Camera className="w-3.5 h-3.5" />
                        {localCoverPic ? "Change cover" : "Add cover"}
                      </div>
                    )}
                  </div>
                </div>
                {/* Avatar overlapping cover */}
                <div className="absolute -bottom-8 left-4">
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden bg-muted cursor-pointer relative group border-2 border-background hover:border-[#b57e04] transition-colors"
                    onClick={() => picInputRef.current?.click()}
                  >
                    {localMainPic ? (
                      <Image src={localMainPic} alt="Agent photo" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#b57e04] to-[#d4a017]">
                        <span className="text-white font-bold text-base font-ui">{initials}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      {uploadingPic === "main" ? (
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-ui mt-1">
                Click either image to upload. Max 2MB. Changes are saved immediately.
              </p>
              <input
                ref={picInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAgentPic(f, "main"); e.target.value = ""; }}
              />
              <input
                ref={coverPicInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAgentPic(f, "cover"); e.target.value = ""; }}
              />
            </div>
            <div>
              <Label className="font-ui text-sm font-medium mb-1.5 block">Agent Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui"
              />
            </div>
            <div>
              <Label className="font-ui text-sm font-medium mb-1.5 block">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none min-h-[100px] focus-visible:ring-[#b57e04] font-ui"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-ui text-sm font-medium mb-1.5 block">Min Price (USD)</Label>
                <Input
                  type="number"
                  value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))}
                  className="focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
              <div>
                <Label className="font-ui text-sm font-medium mb-1.5 block">Max Price (USD)</Label>
                <Input
                  type="number"
                  value={form.priceTo}
                  onChange={(e) => setForm((f) => ({ ...f, priceTo: e.target.value }))}
                  className="focus-visible:ring-[#b57e04] font-ui"
                />
              </div>
            </div>
            <div>
              <Label className="font-ui text-sm font-medium mb-1.5 block">Webhook URL</Label>
              <Input
                type="url"
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                className="font-mono focus-visible:ring-[#b57e04]"
                placeholder="https://my-agent.example.com/webhook"
              />
            </div>
            {categories && categories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-ui text-sm font-medium">Categories</Label>
                  <span className={`text-xs font-ui font-medium px-2 py-0.5 rounded-full ${form.categorySlugs.length >= 3 ? "bg-[#b57e04]/10 text-[#b57e04]" : "bg-muted text-muted-foreground"}`}>
                    {form.categorySlugs.length}/3
                  </span>
                </div>

                {/* Selected chips */}
                {form.categorySlugs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.categorySlugs.map((slug) => {
                      const meta = getCategoryMeta(slug);
                      return (
                        <span key={slug} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 text-xs rounded-full bg-[#b57e04] text-white font-ui">
                          <span>{meta?.emoji}</span>
                          <span>{meta?.label ?? slug}</span>
                          <button type="button" onClick={() => toggleCategory(slug)} className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-2">
                  <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[#b57e04] font-ui"
                  />
                </div>

                {/* Scrollable list */}
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-card p-1.5 space-y-0.5">
                  {categories
                    .filter((cat) => {
                      const meta = getCategoryMeta(cat.slug);
                      const label = meta?.label ?? cat.name;
                      return label.toLowerCase().includes(categorySearch.toLowerCase());
                    })
                    .map((cat) => {
                      const meta = getCategoryMeta(cat.slug);
                      const sel = form.categorySlugs.includes(cat.slug);
                      const disabled = !sel && form.categorySlugs.length >= 3;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => toggleCategory(cat.slug)}
                          disabled={disabled}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-left transition-colors font-ui ${
                            sel
                              ? "bg-[#b57e04]/10 text-[#b57e04]"
                              : disabled
                              ? "opacity-30 cursor-not-allowed text-muted-foreground"
                              : "hover:bg-accent text-foreground"
                          }`}
                        >
                          <span className="text-base leading-none w-5 text-center">{meta?.emoji ?? "📁"}</span>
                          <span className="flex-1">{meta?.label ?? cat.name}</span>
                          {sel && (
                            <svg className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          )}
                        </button>
                      );
                    })}
                </div>
                {form.categorySlugs.length >= 3 && (
                  <p className="text-xs text-muted-foreground mt-1.5 font-ui">Maximum 3 categories. Remove one to select another.</p>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="flex-1 border-border font-ui"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name || !form.description}
                className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rotate confirmation dialog */}
      <Dialog open={confirmRotateOpen} onOpenChange={setConfirmRotateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Rotate API Key?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm font-ui leading-relaxed">
            Your current key will stop working <span className="font-semibold text-foreground">immediately</span>. Any
            webhook server using it will fail until you update the key.
          </p>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setConfirmRotateOpen(false)}
              className="flex-1 border-border font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRotateConfirmed}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-ui font-medium gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Rotate Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New API key modal — centered, shown once after successful rotation */}
      <Dialog open={newKeyModalOpen} onOpenChange={setNewKeyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              API Key Rotated
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-ui">
                Your old key is now invalid. Copy and save your new key below — it will never be shown again.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-ui mb-1.5 uppercase tracking-wide">New API Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 bg-muted border border-border rounded-lg px-3 py-2.5 text-[#b57e04] font-mono text-sm break-all select-all">
                  {newApiKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-shrink-0 border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 font-ui"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-[#b57e04]" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-ui mb-3">
                <span className="font-semibold">Note:</span> Download your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-xs">skill.md</code> now — this file contains <span className="font-semibold">all your credentials</span> (API key + HMAC secret) and will not be available again after you close this dialog. Keep it safe and do not commit it to version control. You can give this file directly to your AI agent to configure it.
              </p>
              <Button
                variant="outline"
                className="w-full border-amber-300 dark:border-amber-700 hover:border-[#b57e04] hover:text-[#b57e04] gap-2 font-ui"
                disabled={downloadingSkill}
                onClick={async () => {
                  if (!newApiKey) return;
                  setDownloadingSkill(true);
                  try { await downloadSkillMd(newApiKey, newWebhookSecret ?? ""); } finally { setDownloadingSkill(false); }
                }}
              >
                {downloadingSkill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download skill.md
              </Button>
            </div>
            <Button
              onClick={() => setNewKeyModalOpen(false)}
              className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
