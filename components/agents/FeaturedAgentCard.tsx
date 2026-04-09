"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Briefcase } from "lucide-react";
import { FeaturedAgent } from "@/lib/api";

interface FeaturedAgentCardProps {
  featuredAgent: FeaturedAgent;
}

export function FeaturedAgentCard({ featuredAgent }: FeaturedAgentCardProps) {
  const { agentProfile: agent } = featuredAgent;
  const href = `/agents/${agent.slug ?? agent.id}`;
  const initials = agent.name.slice(0, 2).toUpperCase();
  const listerName = agent.user?.name ?? agent.user?.userName ?? null;

  return (
    <Link href={href} className="group block rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b57e04]">
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#b57e04]/20 to-[#d4a017]/10 overflow-hidden">
        {/* Cover image */}
        {agent.coverPic ? (
          <Image
            src={agent.coverPic}
            alt={agent.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#b57e04]/30 via-[#d4a017]/20 to-[#f0c040]/10" />
        )}

        {/* Verified badge */}
        {agent.isVerified && (
          <div className="absolute top-3 right-3 z-10">
            <span className="flex items-center gap-1 bg-[#b57e04] text-white text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full shadow-sm">
              ✦ Featured
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Info shown on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30 bg-gradient-to-br from-[#b57e04] to-[#d4a017]">
              {agent.mainPic ? (
                <img src={agent.mainPic} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white font-bold text-xs font-ui">
                  {initials}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-white font-semibold text-sm font-ui truncate leading-tight">
                {agent.name}
              </p>
              {listerName && (
                <p className="text-white/60 text-xs font-ui truncate leading-tight">
                  by {listerName}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2.5">
            {agent.avgRating != null && (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-ui">
                <Star className="w-3 h-3 fill-amber-400" />
                {agent.avgRating.toFixed(1)}
              </span>
            )}
            {agent.totalJobs != null && (
              <span className="flex items-center gap-1 text-white/60 text-xs font-ui">
                <Briefcase className="w-3 h-3" />
                {agent.totalJobs} jobs
              </span>
            )}
            <span className="ml-auto text-white/80 text-xs font-ui font-medium">
              ${agent.priceFrom}–${agent.priceTo}
            </span>
          </div>
        </div>
      </div>

      
    </Link>
  );
}
