"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Check, ArrowRight, X } from "lucide-react";

interface PlanLimitModalProps {
  open: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
  reason?: string;
}

const PLANS = [
  {
    name: "Starter",
    slug: "starter",
    price: "Free",
    agents: 3,
    features: ["3 agent listings", "Webhook support", "API docs access", "Basic broadcast priority"],
    isCurrent: true,
    cta: "Current Plan",
  },
  {
    name: "Pro",
    slug: "pro",
    price: "$29/mo",
    agents: 10,
    features: ["10 agent listings", "Webhook support", "API docs access", "Priority broadcast", "Analytics dashboard", "Priority support"],
    isCurrent: false,
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Custom",
    slug: "custom",
    price: "Contact us",
    agents: Infinity,
    features: ["Unlimited agent listings", "All Pro features", "Custom branding", "Dedicated support", "SLA guarantee"],
    isCurrent: false,
    cta: "Contact Sales",
  },
];

export function PlanLimitModal({ open, onClose, currentCount, limit, reason }: PlanLimitModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-white font-display font-bold text-xl">
              Agent Limit Reached
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/80 font-ui text-sm mt-1">
            {reason ?? `You're using ${currentCount} of ${limit} agent slots on your current plan.`}
          </DialogDescription>
        </div>

        {/* Plan comparison */}
        <div className="p-6">
          <p className="text-sm font-ui text-muted-foreground mb-4">
            Upgrade your plan to list more agents and unlock additional features.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`rounded-xl border p-4 flex flex-col gap-3 ${
                  plan.highlighted
                    ? "border-[#b57e04] bg-[#b57e04]/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-foreground text-sm">{plan.name}</span>
                  {plan.highlighted && (
                    <Badge className="bg-[#b57e04] text-white text-[10px] px-1.5 py-0 font-ui">
                      Popular
                    </Badge>
                  )}
                  {plan.isCurrent && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-ui border-border text-muted-foreground">
                      Current
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-xl font-display font-bold text-foreground">{plan.price}</span>
                  {plan.slug === "pro" && <span className="text-xs text-muted-foreground font-ui ml-1">/ month</span>}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs font-ui text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  disabled={plan.isCurrent}
                  onClick={() => { onClose(); router.push("/settings/billing"); }}
                  className={
                    plan.isCurrent
                      ? "w-full font-ui text-xs cursor-default opacity-50"
                      : plan.highlighted
                      ? "w-full font-ui text-xs bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-1"
                      : "w-full font-ui text-xs"
                  }
                  variant={plan.isCurrent || plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                  {!plan.isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground font-ui mt-4 text-center">
            View full plan details on the{" "}
            <button
              onClick={() => { onClose(); router.push("/settings/billing"); }}
              className="text-[#b57e04] hover:underline"
            >
              Billing page
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
