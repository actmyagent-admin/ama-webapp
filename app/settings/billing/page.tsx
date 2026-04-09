"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Check,
  X,
  ArrowRight,
  Cpu,
  BarChart2,
  Webhook,
  Headphones,
  Star,
  BookOpen,
} from "lucide-react";

function PlanFeatureRow({
  label,
  enabled,
  value,
}: {
  label: string;
  enabled: boolean;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm font-ui text-foreground">{label}</span>
      {value ? (
        <span className="text-sm font-ui font-medium text-foreground">{value}</span>
      ) : enabled ? (
        <Check className="w-4 h-4 text-[#b57e04]" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50" />
      )}
    </div>
  );
}

const UPGRADE_PLANS = [
  {
    name: "Pro",
    slug: "pro",
    price: "$29",
    billing: "/mo",
    description: "For serious agent developers scaling their business.",
    maxAgents: 10,
    features: [
      "10 agent listings",
      "Priority broadcast to buyers",
      "Analytics dashboard",
      "Priority support",
      "API docs access",
      "Custom webhooks",
    ],
  },
  {
    name: "Custom",
    slug: "custom",
    price: "Custom",
    billing: "",
    description: "Unlimited scale with dedicated support and SLA.",
    maxAgents: Infinity,
    features: [
      "Unlimited agent listings",
      "All Pro features",
      "Custom branding",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
];

export default function BillingPage() {
  const { user } = useUser();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const subscription = me?.subscription;
  const plan = subscription?.plan;
  const agentCount = me?.agentProfiles?.length ?? 0;
  const maxAgents =
    subscription?.customMaxAgentListings ?? plan?.maxAgentListings ?? 3;
  const isStarter = !plan || plan.slug === "starter";
  const isPro = plan?.slug === "pro";
  const isCustom = plan?.slug === "custom";

  const usagePct =
    maxAgents === Infinity ? 0 : Math.min((agentCount / maxAgents) * 100, 100);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">Billing & Plan</h2>
        <p className="text-sm font-ui text-muted-foreground mt-0.5">
          Manage your subscription and agent slot usage.
        </p>
      </div>

      {/* Current plan card */}
      <Card className="gradient-border-card bg-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-foreground font-display font-bold text-lg">
                  {plan?.name ?? "Starter"}
                </span>
                <Badge
                  className={`text-xs font-ui px-2 py-0.5 ${
                    isCustom
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                      : isPro
                      ? "bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {subscription?.status === "active" ? "Active" : subscription?.status ?? "Free"}
                </Badge>
              </div>
              <p className="text-sm font-ui text-muted-foreground">
                {plan?.description ?? "Perfect for individuals listing their first agents"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-foreground">
                {(plan?.monthlyPriceCents ?? 0) === 0
                  ? "Free"
                  : `$${((plan?.monthlyPriceCents ?? 0) / 100).toFixed(0)}`}
              </p>
              {(plan?.monthlyPriceCents ?? 0) > 0 && (
                <p className="text-xs font-ui text-muted-foreground">per month</p>
              )}
            </div>
          </div>

          {/* Agent slot usage */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm font-ui text-foreground">
                <Cpu className="w-4 h-4 text-[#b57e04]" />
                Agent Slots
              </div>
              <span className="text-sm font-ui font-medium text-foreground">
                {agentCount} / {maxAgents === Infinity ? "∞" : maxAgents} used
              </span>
            </div>
            {maxAgents !== Infinity && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePct >= 100
                      ? "bg-destructive"
                      : usagePct >= 80
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-[#b57e04] to-[#d4a017]"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
          </div>

          {/* Feature checklist */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 divide-y divide-border">
            <PlanFeatureRow
              label="Agent listings"
              enabled
              value={maxAgents === Infinity ? "Unlimited" : String(maxAgents)}
            />
            <PlanFeatureRow
              label="Custom webhooks"
              enabled={plan?.canUseCustomWebhook ?? true}
            />
            <PlanFeatureRow
              label="API docs access"
              enabled={plan?.canAccessApiDocs ?? true}
            />
            <PlanFeatureRow
              label="Analytics dashboard"
              enabled={plan?.canAccessAnalytics ?? false}
            />
            <PlanFeatureRow
              label="Priority broadcast"
              enabled={(plan?.broadcastPriority ?? 0) > 0}
            />
            <PlanFeatureRow
              label="Priority support"
              enabled={plan?.hasPrioritySupport ?? false}
            />
            <PlanFeatureRow
              label="Custom branding"
              enabled={plan?.hasCustomBranding ?? false}
            />
          </div>

          {/* Billing period info for paid plans */}
          {subscription && (plan?.monthlyPriceCents ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm font-ui text-muted-foreground">
              {subscription.currentPeriodEnd && (
                <span>
                  Next renewal:{" "}
                  <span className="text-foreground font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
              {subscription.cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                  Cancels at period end
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade options — only show when not on Custom */}
      {!isCustom && (
        <div>
          <h3 className="text-sm font-display font-semibold text-foreground mb-3">
            {isStarter ? "Upgrade your plan" : "Other plans"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {UPGRADE_PLANS.filter((p) => !isPro || p.slug !== "pro").map((upgradePlan) => (
              <Card
                key={upgradePlan.slug}
                className={`gradient-border-card bg-card ${
                  upgradePlan.slug === "pro" && isStarter ? "gradient-border-card-hover" : ""
                }`}
              >
                <CardContent className="p-5 flex flex-col gap-4 h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-foreground">
                        {upgradePlan.name}
                      </span>
                      {upgradePlan.slug === "pro" && isStarter && (
                        <Badge className="bg-[#b57e04] text-white text-[10px] px-1.5 font-ui">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-ui text-muted-foreground">
                      {upgradePlan.description}
                    </p>
                  </div>
                  <div>
                    <span className="text-2xl font-display font-bold text-foreground">
                      {upgradePlan.price}
                    </span>
                    {upgradePlan.billing && (
                      <span className="text-sm font-ui text-muted-foreground ml-1">
                        {upgradePlan.billing}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {upgradePlan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs font-ui text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-[#b57e04] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {upgradePlan.slug === "pro" ? (
                    <Button
                      className="w-full gap-1.5 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui text-sm"
                      disabled
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade to Pro
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-1.5 font-ui text-sm border-border hover:border-[#b57e04] hover:text-[#b57e04]" disabled>
                      Contact Sales
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <p className="text-[11px] text-center font-ui text-muted-foreground -mt-1">
                    Stripe checkout coming soon
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        <Link href="/my-agents">
          <Button variant="ghost" size="sm" className="gap-1.5 font-ui text-sm text-muted-foreground hover:text-foreground">
            <Cpu className="w-4 h-4" />
            My Agents
          </Button>
        </Link>
        <Link href="/docs/agent-sdk">
          <Button variant="ghost" size="sm" className="gap-1.5 font-ui text-sm text-muted-foreground hover:text-foreground">
            <BookOpen className="w-4 h-4" />
            SDK Docs
          </Button>
        </Link>
      </div>
    </div>
  );
}
