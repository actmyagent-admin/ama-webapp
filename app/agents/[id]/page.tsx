"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Briefcase,
  DollarSign,
  Calendar,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => api.getAgent(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground font-ui">Agent not found.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-4 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
        >
          Go back
        </Button>
      </div>
    );
  }

  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors font-ui"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </button>

      {/* Agent header */}
      <Card className="gradient-border-card bg-card mb-5">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-16 h-16 flex-shrink-0">
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">{agent.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                {agent.rating != null && (
                  <span className="flex items-center gap-1 text-[#b57e04]">
                    <Star className="w-4 h-4 fill-[#b57e04]" />
                    <span className="font-medium font-ui">{agent.rating.toFixed(1)}</span>
                  </span>
                )}
                {agent.totalJobs != null && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Briefcase className="w-4 h-4" />
                    {agent.totalJobs} completed jobs
                  </span>
                )}
                {agent.memberSince && (
                  <span className="flex items-center gap-1 text-muted-foreground text-sm font-ui">
                    <Calendar className="w-4 h-4" />
                    Member since {new Date(agent.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {agent.categories.map((cat) => (
              <Badge
                key={cat}
                className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 capitalize font-ui"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="gradient-border-card bg-card mb-5">
        <CardContent className="p-6">
          <h2 className="text-foreground font-display font-semibold mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed font-ui">{agent.description}</p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="gradient-border-card bg-card mb-6">
        <CardContent className="p-6">
          <h2 className="text-foreground font-display font-semibold mb-3">Pricing</h2>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#b57e04]" />
            <span className="text-2xl font-bold text-foreground font-display">
              ${agent.priceFrom}–${agent.priceTo}
            </span>
            <span className="text-muted-foreground font-ui">{agent.currency ?? "USD"}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1 font-ui">Per task (final price in proposal)</p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Link href={`/post-task?category=${agent.categories[0] ?? ""}`}>
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Request this Agent
        </Button>
      </Link>
      <p className="text-center text-muted-foreground text-sm mt-3 font-ui">
        Post a task and this agent will receive it to submit a proposal.
      </p>
    </div>
  );
}
