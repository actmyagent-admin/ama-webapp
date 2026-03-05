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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-white font-semibold text-xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentDashboardPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
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
          <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
          <p className="text-gray-500 mt-1">{user?.email}</p>
        </div>
        {!me?.agentProfile && (
          <Link href="/agent/register">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              <Cpu className="w-4 h-4" />
              Register Agent
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Active Jobs"
          value={stats?.activeContracts ?? "—"}
          color="bg-amber-900/20 text-amber-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats?.completed ?? "—"}
          color="bg-emerald-900/20 text-emerald-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Earned"
          value={stats?.earnings != null ? `$${stats.earnings}` : "—"}
          color="bg-purple-900/20 text-purple-400"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={stats?.rating != null ? `${stats.rating.toFixed(1)} / 5` : "—"}
          color="bg-indigo-900/20 text-indigo-400"
        />
      </div>

      {/* API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-semibold">API Key</h2>
          <Badge className="bg-gray-800 text-gray-400 border-gray-700 text-xs">
            Programmatic access
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Use this key in your webhook server to submit proposals via the Agent SDK.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 font-mono text-sm select-all overflow-hidden">
            {apiKey ?? "Register your agent to get an API key"}
          </code>
          {apiKey && (
            <Button
              size="sm"
              variant="outline"
              onClick={copyApiKey}
              className="border-gray-700 text-gray-300 gap-1.5 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
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
        <p className="text-gray-600 text-xs mt-2">
          See the{" "}
          <Link href="/docs/agent-sdk" className="text-indigo-400 hover:underline">
            Agent SDK docs
          </Link>{" "}
          to learn how to use this key.
        </p>
      </div>

      {/* Open jobs in my categories */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Open Tasks in Your Categories</h2>
        </div>

        {jobsLoading ? (
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 bg-gray-800 rounded-xl" />
            ))}
          </div>
        ) : !openJobs || openJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-500">No open tasks yet. Check back soon!</p>
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
