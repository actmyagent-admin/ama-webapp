"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getCategoryMeta } from "@/lib/categories";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Briefcase, DollarSign, ArrowLeft } from "lucide-react";
import { InstagramIcon, FacebookIcon, XIcon, DiscordIcon } from "@/components/ui/SocialIcons";

function DefaultAvatar({ name, size = 96 }: { name?: string | null; size?: number }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : null;
  return (
    <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id="profileAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b57e04" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="48" fill="url(#profileAvatarGrad)" />
      {initials ? (
        <text
          x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          fill="white" fontSize="32" fontWeight="bold" fontFamily="system-ui, sans-serif"
        >
          {initials}
        </text>
      ) : (
        /* User silhouette — head + shoulders, visually centred */
        <g fill="white" opacity="0.9">
          <circle cx="48" cy="37" r="11" />
          <path d="M20 69 C20 55 76 55 76 69" />
        </g>
      )}
    </svg>
  );
}

export default function ProfilePage() {
  const { userName } = useParams<{ userName: string }>();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", userName],
    queryFn: () => api.getPublicProfile(userName),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">Profile Not Found</h1>
        <p className="text-muted-foreground font-ui mb-8">
          No user found with the username <span className="font-mono text-foreground">@{userName}</span>.
        </p>
        <Link href="/agents">
          <Button variant="outline" className="border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse Agents
          </Button>
        </Link>
      </div>
    );
  }

  const isAgent = profile.roles.includes("AGENT_LISTER");
  const agent = profile.agentProfile;

  return (
    <div>
      {/* Full-width cover photo — sits below the navbar with a small gap */}
      <div className="relative h-48 sm:h-56 mt-4 mx-4 sm:mx-6 lg:mx-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#b57e04]/20 to-[#d4a017]/10 border border-border">
        {profile.coverPic && (
          <Image src={profile.coverPic} alt="Cover" fill className="object-cover" unoptimized />
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Avatar + role badges row */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between">
          <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted flex-shrink-0 shadow-md">
            {profile.mainPic ? (
              <Image
                src={profile.mainPic} alt={profile.name ?? userName}
                width={96} height={96} className="object-cover w-full h-full" unoptimized
              />
            ) : (
              <DefaultAvatar name={profile.name} size={96} />
            )}
          </div>
          <div className="flex gap-2 mb-1">
            {profile.roles.map((r) => (
              <Badge key={r} className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 text-xs font-ui">
                {r === "AGENT_LISTER" ? "Agent Lister" : "Buyer"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Name + handle */}
        <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
          {profile.name ?? `@${profile.userName}`}
        </h1>
        <p className="text-muted-foreground font-mono text-sm mb-4">@{profile.userName}</p>

        {/* Bio brief */}
        {profile.bioBrief && (
          <p className="text-foreground font-ui font-medium mb-3 leading-relaxed">
            {profile.bioBrief}
          </p>
        )}

        {/* Bio detail */}
        {profile.bioDetail && (
          <p className="text-muted-foreground font-ui text-sm leading-relaxed mb-6">
            {profile.bioDetail}
          </p>
        )}

        {/* Social links */}
        {(() => {
          const links = [
            { href: profile.instagram, Icon: InstagramIcon, label: "Instagram" },
            { href: profile.facebook,  Icon: FacebookIcon,  label: "Facebook"  },
            { href: profile.x,         Icon: XIcon,         label: "X"         },
            { href: profile.discord,   Icon: DiscordIcon,   label: "Discord"   },
          ].filter((l) => !!l.href);
          return links.length > 0 ? (
            <div className="flex items-center gap-3 mb-8">
              {links.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-muted hover:bg-[#b57e04]/10 text-muted-foreground hover:text-[#b57e04] border border-border hover:border-[#b57e04]/40 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          ) : null;
        })()}

        {/* Agent profile section */}
        {isAgent && agent && (
          <div className="pb-12">
            <h2 className="text-base font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Agent
            </h2>
            <Card className="gradient-border-card gradient-border-card-hover bg-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Agent icon */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {agent.mainPic ? (
                      <Image
                        src={agent.mainPic} alt={agent.name}
                        width={56} height={56} className="object-cover w-full h-full" unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#b57e04] to-[#d4a017] flex items-center justify-center">
                        <span className="text-white font-bold text-xl font-display">
                          {agent.name[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Agent name + verified */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-foreground">{agent.name}</h3>
                      {agent.isVerified && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-ui">
                          Verified
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground text-sm font-ui line-clamp-2 mb-3">
                      {agent.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-ui flex-wrap">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-[#b57e04]" />
                        ${agent.priceFrom}–${agent.priceTo} {agent.currency}
                      </span>
                      {agent.avgRating != null && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-[#b57e04] fill-[#b57e04]" />
                          {agent.avgRating.toFixed(1)}
                        </span>
                      )}
                      {agent.totalJobs != null && agent.totalJobs > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {agent.totalJobs} job{agent.totalJobs !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {agent.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {agent.categories.map((cat) => {
                      const meta = getCategoryMeta(cat.slug);
                      const Icon = meta?.icon;
                      return (
                        <span
                          key={cat.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-border text-muted-foreground font-ui bg-muted/50"
                        >
                          {Icon && <Icon className={`w-3 h-3 ${meta?.iconColor}`} />}
                          {meta?.label ?? cat.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Spacer for non-agent profiles */}
        {(!isAgent || !agent) && <div className="pb-12" />}
      </div>
    </div>
  );
}
