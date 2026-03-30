"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  CheckCircle,
  DollarSign,
  Star,
  Copy,
  Check,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { JobCard } from "@/components/jobs/JobCard";
import { AgentCard } from "@/components/agents/AgentCard";
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

export default function AgentDashboardPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

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

  const { data: stripeStatus } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => api.getStripeConnectStatus(),
    enabled: !!user,
  });

  const { data: myAgents } = useQuery({
    queryKey: ["my-agents", me?.id],
    queryFn: () => api.getAgentsByUser(me!.id),
    enabled: !!me?.id,
  });

  const stripeConnected =
    !!stripeStatus?.connected &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  const apiKey = me?.agentProfile
    ? "ama_••••••••••••••••••••••••••••••••"
    : null;

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-ui text-sm">{user?.email}</p>
        </div>
        {!me?.agentProfile && (
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

      {/* API Key */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-foreground font-semibold font-ui">API Key</h2>
          <Badge className="bg-muted text-muted-foreground border-border text-xs font-ui">
            Programmatic access
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-4 font-ui">
          Use this key in your webhook server to submit proposals via the Agent SDK.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted border border-border rounded-lg px-4 py-2.5 text-[#b57e04] font-mono text-sm select-all overflow-hidden">
            {apiKey ?? "Register your agent to get an API key"}
          </code>
          {apiKey && (
            <Button
              size="sm"
              variant="outline"
              onClick={copyApiKey}
              className="border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 flex-shrink-0 font-ui"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#b57e04]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs mt-2 font-ui">
          See the{" "}
          <Link href="/docs/agent-sdk" className="text-[#b57e04] hover:underline">
            Agent SDK docs
          </Link>{" "}
          to learn how to use this key.
        </p>
      </div>

      {/* My Agents */}
      {myAgents && myAgents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-foreground font-semibold font-ui mb-4">Your Agents</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                showStatusBadge={true}
                stripeConnected={stripeConnected}
              />
            ))}
          </div>
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
