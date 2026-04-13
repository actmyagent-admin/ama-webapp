"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Shield,
} from "lucide-react";
import Link from "next/link";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { SITE_URL } from "@/lib/seo-data";
import { RequestAgentButton } from "@/components/agents/RequestAgentButton";

const DEFAULT_COVER = "/images/askmyagent-agent-backgroud.png";

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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-56 w-full rounded-none" />
        <div className="flex items-end gap-4 -mt-10 px-4">
          <Skeleton className="w-28 h-28 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pb-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
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
  const coverUrl = agent.coverPic || DEFAULT_COVER;
  const avatarUrl = agent.mainPic ?? agent.avatarUrl;
  const isAvailable =
    agent.availabilityStatus == null || agent.availabilityStatus === "available";

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
    serviceType: agent.categories
      ?.map((c: { name: string }) => c.name)
      .join(", "),
  };

  return (
    <div className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentJsonLd) }}
      />

      {/* ── COVER HERO ── */}
      <div className="relative w-full">
        {/* Cover image */}
        <div className="relative h-52 sm:h-64 w-full overflow-hidden">
          <img
            src={coverUrl}
            alt="Agent cover"
            className="w-full h-full object-cover object-top"
          />
          {/* Gradient overlay — darker at bottom so avatar pops */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/75" />
          {/* Futuristic circuit-grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(181,126,4,1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(181,126,4,1) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          {/* Scanline texture */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.15)_3px,rgba(255,255,255,0.15)_4px)]" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 transition-all font-ui"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Availability badge */}
          {isAvailable ? (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-ui font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Available
            </div>
          ) : (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-ui font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Busy
            </div>
          )}
        </div>

        {/* ── PROFILE SECTION ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Avatar row — overlaps the cover, no name here so it stays visible */}
          <div className="-mt-14 sm:-mt-16 mb-4">
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#b57e04] via-[#d4a017] to-[#f0c040] opacity-70 blur-sm" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-2 ring-[#b57e04] overflow-hidden bg-card shadow-xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={agent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#b57e04] to-[#d4a017] flex items-center justify-center">
                    <span className="text-white text-2xl sm:text-3xl font-bold font-display">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name + listed-by — fully below the cover */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">
              {agent.name}
            </h1>
            {agent.user && (
              <p className="text-xs text-muted-foreground font-ui mt-0.5">
                by{" "}
                <Link
                  href={`/profile/${agent.user.userName}`}
                  className="text-foreground hover:text-[#b57e04] transition-colors font-medium"
                >
                  {agent.user.name ?? agent.user.userName}
                </Link>
              </p>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
            {agent.avgRating != null && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#b57e04] text-[#b57e04]" />
                <span className="font-bold text-foreground font-ui text-sm">
                  {agent.avgRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-xs font-ui">rating</span>
              </div>
            )}
            {agent.totalJobs != null && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#b57e04]" />
                <span className="font-bold text-foreground font-ui text-sm">
                  {agent.totalJobs}
                </span>
                <span className="text-muted-foreground text-xs font-ui">
                  completed
                </span>
              </div>
            )}
            {agent.memberSince && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs font-ui">
                  Since{" "}
                  {new Date(agent.memberSince).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Categories */}
          {/* Categories + Share on the same row */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap gap-1.5">
              {agent.categories.map((cat) => (
                <Badge
                  key={cat.id || cat.slug}
                  className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 capitalize font-ui text-xs"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
            <div className="flex-shrink-0">
              <ShareButtons
                url={pageUrl}
                title={`${agent.name} — AI Agent on ActMyAgent`}
                description={shareDescription}
              />
            </div>
          </div>

          {/* ── REQUEST BUTTON — prominent, at the top ── */}
          <div className="mb-6">
            <RequestAgentButton agent={agent} />
          </div>

          {/* Quick-terms stat cards */}
          {(agent.deliveryDays != null ||
            agent.revisionsIncluded != null ||
            agent.responseTimeSlaHours != null) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {agent.deliveryDays != null && (
                <div className="flex items-center gap-3 bg-[#b57e04]/5 border border-[#b57e04]/15 rounded-xl px-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b57e04]/15 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#b57e04]" />
                  </div>
                  <div>
                    <div className="text-foreground font-semibold text-sm font-ui leading-none">
                      {agent.deliveryDays}d
                    </div>
                    <div className="text-muted-foreground text-xs font-ui mt-0.5">
                      delivery
                    </div>
                  </div>
                </div>
              )}
              {agent.revisionsIncluded != null && (
                <div className="flex items-center gap-3 bg-[#b57e04]/5 border border-[#b57e04]/15 rounded-xl px-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b57e04]/15 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-4 h-4 text-[#b57e04]" />
                  </div>
                  <div>
                    <div className="text-foreground font-semibold text-sm font-ui leading-none">
                      {agent.revisionsIncluded}
                    </div>
                    <div className="text-muted-foreground text-xs font-ui mt-0.5">
                      revision{agent.revisionsIncluded !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
              {agent.responseTimeSlaHours != null && (
                <div className="flex items-center gap-3 bg-[#b57e04]/5 border border-[#b57e04]/15 rounded-xl px-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b57e04]/15 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#b57e04]" />
                  </div>
                  <div>
                    <div className="text-foreground font-semibold text-sm font-ui leading-none">
                      {agent.responseTimeSlaHours}h
                    </div>
                    <div className="text-muted-foreground text-xs font-ui mt-0.5">
                      response
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ABOUT CARD ── */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b57e04]/60 to-transparent" />
            <div className="p-5">
              <h2 className="text-foreground font-display font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#b57e04] to-[#f0c040] rounded-full" />
                About
              </h2>
              <p className="text-muted-foreground leading-relaxed font-ui text-sm">
                {agent.description}
              </p>
            </div>
          </div>

          {/* ── PRICING CARD ── */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b57e04]/60 to-transparent" />
            <div className="p-5">
              <h2 className="text-foreground font-display font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#b57e04] to-[#f0c040] rounded-full" />
                Pricing
              </h2>
              <div className="flex items-baseline gap-2 flex-wrap">
                <DollarSign className="w-5 h-5 text-[#b57e04] self-center" />
                <span className="text-3xl font-bold text-foreground font-display">
                  ${agent.priceFrom}
                </span>
                <span className="text-xl text-muted-foreground font-display">
                  – ${agent.priceTo}
                </span>
                <span className="text-muted-foreground font-ui text-sm">
                  {agent.currency ?? "USD"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-1.5 font-ui">
                Per task · Final price confirmed in proposal
              </p>
            </div>
          </div>

          {/* ── ESCROW TRUST NOTE ── */}
          <div className="flex items-start gap-3 bg-[#b57e04]/5 border border-[#b57e04]/15 rounded-xl px-4 py-3 mb-6">
            <Shield className="w-5 h-5 text-[#b57e04] flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs font-ui leading-relaxed">
              Funds held in{" "}
              <span className="text-foreground font-medium">secure escrow</span>{" "}
              until you approve delivery. 15% platform fee on completion.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
