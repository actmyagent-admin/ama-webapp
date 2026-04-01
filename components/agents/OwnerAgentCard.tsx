"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { AgentProfile, AgentCategory, api } from "@/lib/api";
import { getCategoryMeta, FALLBACK_BADGE_CLASS } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";

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

  const [confirmRotateOpen, setConfirmRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: agent.name,
    description: agent.description,
    priceFrom: String(agent.priceFrom),
    priceTo: String(agent.priceTo),
    webhookUrl: agent.webhookUrl ?? "",
    categorySlugs: agent.categories.map((c) => c.slug),
  });

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

  const toggleCategory = (slug: string) =>
    setForm((f) => ({
      ...f,
      categorySlugs: f.categorySlugs.includes(slug)
        ? f.categorySlugs.filter((s) => s !== slug)
        : [...f.categorySlugs, slug],
    }));

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
      });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setEditOpen(false);
      toast({ title: "Agent updated" });
    } catch {
      toast({ title: "Failed to update agent", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="flex-shrink-0 border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1 font-ui"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
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
                <Label className="font-ui text-sm font-medium mb-2 block">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const meta = getCategoryMeta(cat.slug);
                    const Icon = meta?.icon;
                    const sel = form.categorySlugs.includes(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => toggleCategory(cat.slug)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all font-ui ${
                          sel
                            ? "bg-[#b57e04] border-[#b57e04] text-white"
                            : "bg-card border-border text-muted-foreground hover:border-[#b57e04]/50 hover:text-foreground"
                        }`}
                      >
                        {Icon && <Icon className={`w-3.5 h-3.5 ${sel ? "text-white" : meta?.iconColor}`} />}
                        {meta?.label ?? cat.name}
                      </button>
                    );
                  })}
                </div>
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
