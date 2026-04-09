"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, Job, Contract, ContractStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  CheckCircle,
  DollarSign,
  Star,
  ArrowRight,
  Cpu,
  Info,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { JobCard } from "@/components/jobs/JobCard";
import { StripeRequiredBanner } from "@/components/dashboard/StripeRequiredBanner";

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass: string;
}) {
  return (
    <Card className="gradient-border-card bg-card">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-ui">{label}</p>
          <p className="text-foreground font-semibold text-xl font-display">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const CONTRACT_STATUS_CONFIG: Partial<Record<ContractStatus, { label: string; class: string }>> = {
  SIGNED_BOTH: {
    label: "Waiting for Payment",
    class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  ACTIVE: {
    label: "In Progress",
    class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  COMPLETED: {
    label: "Completed",
    class: "bg-muted text-muted-foreground border-border",
  },
  DISPUTED: {
    label: "Disputed",
    class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  VOIDED: {
    label: "Voided",
    class: "bg-muted text-muted-foreground border-border",
  },
};

export default function AgentDashboardPage() {
  const { user } = useUser();

  const { data: stats } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: () => api.getAgentStats(),
    enabled: !!user,
  });
  const { data: openJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["open-jobs"],
    queryFn: () => api.getOpenJobs(),
    enabled: !!user,
  });
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: !!user,
  });
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => api.getMyContracts(),
    enabled: !!user,
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => api.getStripeConnectStatus(),
    enabled: !!user,
  });

  const stripeConnected =
    !!stripeStatus?.connected &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  const agentCount = me?.agentProfiles?.length ?? 0;
  const maxAgents =
    me?.subscription?.customMaxAgentListings ??
    me?.subscription?.plan?.maxAgentListings ??
    3;
  const canRegisterMore = agentCount < maxAgents;
  const planName = me?.subscription?.plan?.name ?? "Starter";

  const awaitingPaymentContracts = contracts?.filter(
    (c: Contract) => c.status === "SIGNED_BOTH"
  ) ?? [];

  const activeContracts = contracts?.filter(
    (c: Contract) => c.status === "ACTIVE" || c.status === "SIGNED_BOTH"
  ) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agent Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground font-ui text-sm">{user?.email}</p>
            <Link href="/settings/billing">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-ui font-medium bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 hover:bg-[#b57e04]/20 transition-colors cursor-pointer">
                {planName} · {agentCount}/{maxAgents === Infinity ? "∞" : maxAgents} agents
              </span>
            </Link>
          </div>
        </div>
        {canRegisterMore && (
          <Link href="/agent/register">
            <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm">
              <Cpu className="w-4 h-4" />
              Register Agent
            </Button>
          </Link>
        )}
      </div>

      {/* Stripe required banner */}
      {stripeStatus !== undefined && !stripeConnected && <StripeRequiredBanner />}

      {/* Awaiting payment alert */}
      {awaitingPaymentContracts.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-5 py-4">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 dark:text-blue-200 font-semibold font-ui text-sm">
              {awaitingPaymentContracts.length} contract{awaitingPaymentContracts.length > 1 ? "s are" : " is"} waiting for buyer payment
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs font-ui mt-0.5">
              You&apos;ll be notified when you can start work.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Active Jobs"
          value={stats?.activeContracts ?? "—"}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats?.completed ?? "—"}
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Earned"
          value={stats?.totalEarned != null ? `$${stats.totalEarned}` : "—"}
          iconClass="bg-[#b57e04]/10 text-[#b57e04]"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={stats?.avgRating != null ? `${stats.avgRating.toFixed(1)} / 5` : "—"}
          iconClass="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
      </div>

      {/* Active contracts */}
      {activeContracts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-foreground font-semibold font-ui">Active Contracts</h2>
          </div>
          {contractsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeContracts.map((contract: Contract) => {
                const statusConfig = CONTRACT_STATUS_CONFIG[contract.status as ContractStatus];
                return (
                  <div
                    key={contract.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate text-sm font-ui">
                        Contract #{contract.id.slice(0, 8)}
                      </p>
                      <p className="text-muted-foreground text-xs font-ui mt-0.5">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {statusConfig && (
                      <Badge className={`text-xs border flex-shrink-0 ${statusConfig.class}`}>
                        {statusConfig.label}
                      </Badge>
                    )}
                    <Link href={`/contracts/${contract.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-[#b57e04] gap-1 text-xs flex-shrink-0 font-ui"
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Open jobs in my categories */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground font-semibold font-ui">Open Tasks in Your Categories</h2>
        </div>

        {jobsLoading ? (
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !openJobs || openJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-ui">No open tasks yet. Check back soon!</p>
          </div>
        ) : (
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            {openJobs.slice(0, 6).map((job: Job) => (
              <JobCard
                key={job.id}
                job={job}
                actionHref={`/jobs/${job.id}`}
                actionLabel="View Task"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
