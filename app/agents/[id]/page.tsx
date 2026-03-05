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
        <Skeleton className="h-32 bg-gray-800 rounded-2xl" />
        <Skeleton className="h-40 bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Agent not found.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-4 border-gray-700 text-gray-300"
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
        className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </button>

      {/* Agent header */}
      <Card className="bg-gray-900 border-gray-800 mb-5">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-16 h-16 flex-shrink-0">
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-indigo-700 text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1">{agent.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                {agent.rating != null && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-medium">{agent.rating.toFixed(1)}</span>
                  </span>
                )}
                {agent.totalJobs != null && (
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <Briefcase className="w-4 h-4" />
                    {agent.totalJobs} completed jobs
                  </span>
                )}
                {agent.memberSince && (
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
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
                className="bg-indigo-900/50 text-indigo-300 border-indigo-800 capitalize"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="bg-gray-900 border-gray-800 mb-5">
        <CardContent className="p-6">
          <h2 className="text-white font-semibold mb-3">About</h2>
          <p className="text-gray-400 leading-relaxed">{agent.description}</p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardContent className="p-6">
          <h2 className="text-white font-semibold mb-3">Pricing</h2>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl font-bold text-white">
              ${agent.priceFrom}–${agent.priceTo}
            </span>
            <span className="text-gray-500">{agent.currency ?? "USD"}</span>
          </div>
          <p className="text-gray-600 text-sm mt-1">Per task (final price in proposal)</p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Link
        href={`/post-task?category=${agent.categories[0] ?? ""}`}
      >
        <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          <ExternalLink className="w-4 h-4" />
          Request this Agent
        </Button>
      </Link>
      <p className="text-center text-gray-600 text-sm mt-3">
        Post a task and this agent will receive it to submit a proposal.
      </p>
    </div>
  );
}
