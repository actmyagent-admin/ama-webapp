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
  AlertCircle,
  Zap,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { SITE_URL } from "@/lib/seo-data";
import { RequestAgentButton } from "@/components/agents/RequestAgentButton";

export default function AgentProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", slug],
    queryFn: () => api.getAgent(slug),
    enabled: !!slug,
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
  const pageUrl = `${SITE_URL}/agents/${slug}`;
  const shareDescription = agent.description
    ? agent.description.slice(0, 100) + (agent.description.length > 100 ? "..." : "")
    : `Starting from $${agent.priceFrom} ${agent.currency ?? "USD"}`;

  const agentJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: agent.name,
    description: agent.description,
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: "ActMyAgent",
      url: SITE_URL,
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: agent.priceFrom,
      highPrice: agent.priceTo,
      priceCurrency: agent.currency ?? "USD",
    },
    ...(agent.avgRating != null && agent.totalJobs != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: agent.avgRating.toFixed(1),
            reviewCount: agent.totalJobs,
          },
        }
      : {}),
    serviceType: agent.categories?.map((c: { name: string }) => c.name).join(", "),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentJsonLd) }}
      />

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
              {(agent.mainPic ?? agent.avatarUrl) ? (
                <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agent.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">{agent.name}</h1>
              {agent.user && (
                <p className="text-sm text-muted-foreground font-ui mb-1">
                  Listed by{" "}
                  <Link
                    href={`/profile/${agent.user.userName}`}
                    className="text-foreground hover:text-[#b57e04] transition-colors font-medium"
                  >
                    {agent.user.name}
                  </Link>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                {agent.avgRating != null && (
                  <span className="flex items-center gap-1 text-[#b57e04]">
                    <Star className="w-4 h-4 fill-[#b57e04]" />
                    <span className="font-medium font-ui">{agent.avgRating.toFixed(1)}</span>
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
                key={cat.id || cat.slug}
                className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 capitalize font-ui"
              >
                {cat.name}
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

      {/* Agent terms at a glance */}
      {(agent.deliveryDays != null ||
        agent.revisionsIncluded != null ||
        agent.responseTimeSlaHours != null) && (
        <Card className="gradient-border-card bg-card mb-5">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {agent.deliveryDays != null && (
                <div className="flex items-center gap-2 text-sm font-ui">
                  <Zap className="w-4 h-4 text-[#b57e04] flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    {agent.deliveryDays} day delivery
                  </span>
                </div>
              )}
              {agent.revisionsIncluded != null && (
                <div className="flex items-center gap-2 text-sm font-ui">
                  <RotateCcw className="w-4 h-4 text-[#b57e04] flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    {agent.revisionsIncluded} revision
                    {agent.revisionsIncluded !== 1 ? "s" : ""} included
                  </span>
                </div>
              )}
              {agent.responseTimeSlaHours != null && (
                <div className="flex items-center gap-2 text-sm font-ui">
                  <MessageCircle className="w-4 h-4 text-[#b57e04] flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    Responds within {agent.responseTimeSlaHours}h
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <RequestAgentButton agent={agent} />

      {/* Share */}
      <div className="mt-6 flex justify-center">
        <ShareButtons
          url={pageUrl}
          title={`${agent.name} — AI Agent on ActMyAgent`}
          description={shareDescription}
        />
      </div>
    </div>
  );
}
