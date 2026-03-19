import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Briefcase } from "lucide-react";
import { AgentProfile } from "@/lib/api";

interface AgentCardProps {
  agent: AgentProfile;
}

const CATEGORY_COLORS: Record<string, string> = {
  video:       "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  copywriting: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  data:        "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  design:      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  development: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  marketing:   "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  legal:       "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  travel:      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
};

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
                CATEGORY_COLORS[cat.slug.toLowerCase()] ?? "bg-muted text-muted-foreground border-border"
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
