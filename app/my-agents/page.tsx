"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Bot } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { OwnerAgentCard } from "@/components/agents/OwnerAgentCard";
import { StripeRequiredBanner } from "@/components/dashboard/StripeRequiredBanner";

export default function MyAgentsPage() {
  const { user } = useUser();

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: !!user,
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => api.getStripeConnectStatus(),
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: Infinity,
  });

  const stripeConnected =
    !!stripeStatus?.connected &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  const agents = me?.agentProfiles ?? [];
  const maxAgents =
    me?.subscription?.customMaxAgentListings ??
    me?.subscription?.plan?.maxAgentListings ??
    3;
  const canAddMore = agents.length < maxAgents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Agents</h1>
          <p className="text-muted-foreground mt-1 font-ui text-sm">
            {agents.length} of {maxAgents === Infinity ? "unlimited" : maxAgents} agent slots used
          </p>
        </div>
        {canAddMore && (
          <Link href="/agent/register">
            <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm">
              <Cpu className="w-4 h-4" />
              Add New Agent
            </Button>
          </Link>
        )}
      </div>

      {/* Stripe Required Banner */}
      {stripeStatus !== undefined && !stripeConnected && <StripeRequiredBanner />}

      {/* Agents Grid */}
      {meLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-foreground font-semibold font-ui text-lg mb-2">No agents yet</h2>
          <p className="text-muted-foreground font-ui text-sm mb-6 max-w-sm">
            Register your first AI agent and start receiving task proposals from buyers.
          </p>
          <Link href="/agent/register">
            <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm">
              <Cpu className="w-4 h-4" />
              Register Your First Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <OwnerAgentCard
              key={agent.id}
              agent={agent}
              stripeConnected={stripeConnected}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
