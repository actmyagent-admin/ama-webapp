"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getCategoryMeta } from "@/lib/categories";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Briefcase, DollarSign, ArrowLeft, Share2, Check, Copy } from "lucide-react";
import { InstagramIcon, FacebookIcon, XIcon, DiscordIcon } from "@/components/ui/SocialIcons";
import { SITE_URL } from "@/lib/seo-data";

// ─── Inline share-icon SVGs ──────────────────────────────────────────────────
function XSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.84L2.25 2.25h6.877l4.255 5.689L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  );
}
function FbSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function LinkedInSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function WhatsAppSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// ─── Share dropdown ──────────────────────────────────────────────────────────
function ProfileShareDropdown({ url, title, description }: { url: string; title: string; description?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const encodedUrl = encodeURIComponent(url);
  const tweetText = encodeURIComponent(description ? `${title} — ${description}` : title);

  const shareLinks = [
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}&via=actmyagent`, icon: <XSvg />, hoverColor: "hover:text-foreground" },
    { label: "Facebook",   href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,                          icon: <FbSvg />, hoverColor: "hover:text-[#1877f2]" },
    { label: "LinkedIn",   href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,                   icon: <LinkedInSvg />, hoverColor: "hover:text-[#0077b5]" },
    { label: "WhatsApp",   href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,                        icon: <WhatsAppSvg />, hoverColor: "hover:text-[#25d366]" },
  ];

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Share profile"
        className="w-9 h-9 rounded-full flex items-center justify-center bg-muted hover:bg-[#b57e04]/10 text-muted-foreground hover:text-[#b57e04] border border-border hover:border-[#b57e04]/40 transition-all duration-200"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden py-1">
          {shareLinks.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground font-ui transition-colors hover:bg-muted ${opt.hoverColor}`}
            >
              {opt.icon}
              {opt.label}
            </a>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground font-ui transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const agents = profile.agentProfiles ?? [];
  const pageUrl = `${SITE_URL}/profile/${userName}`;
  const displayName = profile.name ?? `@${profile.userName}`;

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": isAgent ? "Person" : "Person",
    name: displayName,
    url: pageUrl,
    ...(profile.mainPic ? { image: profile.mainPic } : {}),
    ...(profile.bioBrief ? { description: profile.bioBrief } : {}),
    ...(isAgent && agents.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${displayName}'s AI Agents`,
            numberOfItems: agents.length,
          },
        }
      : {}),
    sameAs: [
      profile.instagram,
      profile.facebook,
      profile.x,
    ].filter(Boolean),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />

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

        {/* Social links + share */}
        {(() => {
          const links = [
            { href: profile.instagram, Icon: InstagramIcon, label: "Instagram" },
            { href: profile.facebook,  Icon: FacebookIcon,  label: "Facebook"  },
            { href: profile.x,         Icon: XIcon,         label: "X"         },
            { href: profile.discord,   Icon: DiscordIcon,   label: "Discord"   },
          ].filter((l) => !!l.href);
          return (
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
              <ProfileShareDropdown
                url={pageUrl}
                title={isAgent ? `${displayName} — AI Agent Lister on ActMyAgent` : `${displayName} on ActMyAgent`}
                description={profile.bioBrief ?? undefined}
              />
            </div>
          );
        })()}

        {/* Agent profile section */}
        {isAgent && agents.length > 0 && (
          <div className="pb-12">
            <h2 className="text-base font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Agents
            </h2>
            <div className="space-y-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="gradient-border-card gradient-border-card-hover bg-card">
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
                          <Link href={`/agents/${agent.slug ?? agent.id}`}>
                            <h3 className="font-display font-semibold text-foreground hover:text-[#b57e04] transition-colors">{agent.name}</h3>
                          </Link>
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
              ))}
            </div>
          </div>
        )}

        {/* Spacer for non-agent profiles */}
        {(!isAgent || agents.length === 0) && <div className="pb-12" />}
      </div>
    </div>
  );
}
