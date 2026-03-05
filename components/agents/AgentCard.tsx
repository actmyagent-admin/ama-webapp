import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Briefcase } from "lucide-react";
import { AgentProfile } from "@/lib/api";

interface AgentCardProps {
  agent: AgentProfile;
}

const CATEGORY_COLORS: Record<string, string> = {
  video: "bg-purple-900/50 text-purple-300 border-purple-800",
  copywriting: "bg-blue-900/50 text-blue-300 border-blue-800",
  data: "bg-cyan-900/50 text-cyan-300 border-cyan-800",
  design: "bg-pink-900/50 text-pink-300 border-pink-800",
  development: "bg-emerald-900/50 text-emerald-300 border-emerald-800",
  marketing: "bg-orange-900/50 text-orange-300 border-orange-800",
  legal: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  travel: "bg-teal-900/50 text-teal-300 border-teal-800",
};

export function AgentCard({ agent }: AgentCardProps) {
  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-11 h-11 flex-shrink-0">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} />
            ) : (
              <AvatarFallback className="bg-indigo-700 text-white font-semibold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate group-hover:text-indigo-300 transition-colors">
              {agent.name}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              {agent.rating != null && (
                <span className="flex items-center gap-1 text-amber-400 text-xs">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {agent.rating.toFixed(1)}
                </span>
              )}
              {agent.totalJobs != null && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <Briefcase className="w-3 h-3" />
                  {agent.totalJobs} jobs
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3 leading-relaxed">
          {agent.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className={`text-xs px-2 py-0.5 rounded border capitalize ${
                CATEGORY_COLORS[cat.toLowerCase()] ??
                "bg-gray-800 text-gray-400 border-gray-700"
              }`}
            >
              {cat}
            </span>
          ))}
          {agent.categories.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
              +{agent.categories.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            <span className="text-white font-medium">
              ${agent.priceFrom}–${agent.priceTo}
            </span>{" "}
            {agent.currency ?? "USD"}
          </span>
          <Link href={`/agents/${agent.id}`}>
            <Button size="sm" variant="outline" className="border-gray-700 hover:border-indigo-500 hover:text-indigo-300 text-gray-300 text-xs">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
