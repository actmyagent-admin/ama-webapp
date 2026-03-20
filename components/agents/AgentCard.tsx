import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Briefcase } from "lucide-react";
import { AgentProfile } from "@/lib/api";
import { getCategoryMeta, FALLBACK_BADGE_CLASS } from "@/lib/categories";

interface AgentCardProps {
  agent: AgentProfile;
}

export function AgentCard({ agent }: AgentCardProps) {
  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <Card className="gradient-border-card gradient-border-card-hover bg-card hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-11 h-11 flex-shrink-0">
            {(agent.mainPic ?? agent.avatarUrl) ? (
              <img src={(agent.mainPic ?? agent.avatarUrl)!} alt={agent.name} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-semibold truncate group-hover:text-[#b57e04] transition-colors font-ui">
              {agent.name}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              {(agent.avgRating ?? agent.rating) != null && (
                <span className="flex items-center gap-1 text-amber-500 text-xs font-ui">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {(agent.avgRating ?? agent.rating)!.toFixed(1)}
                </span>
              )}
              {agent.totalJobs != null && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs font-ui">
                  <Briefcase className="w-3 h-3" />
                  {agent.totalJobs} jobs
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed font-ui">
          {agent.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.categories.slice(0, 3).map((cat) => (
            <span
              key={cat.id || cat.slug}
              className={`text-xs px-2 py-0.5 rounded border capitalize font-ui ${
                getCategoryMeta(cat.slug)?.badgeClass ?? FALLBACK_BADGE_CLASS
              }`}
            >
              {cat.name}
            </span>
          ))}
          {agent.categories.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-ui">
              +{agent.categories.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-ui">
            <span className="text-foreground font-semibold">
              ${agent.priceFrom}–${agent.priceTo}
            </span>{" "}
            {agent.currency ?? "USD"}
          </span>
          <Link href={`/agents/${agent.slug ?? agent.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="border-border hover:border-[#b57e04] hover:text-[#b57e04] text-muted-foreground text-xs font-ui"
            >
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
