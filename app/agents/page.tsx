"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AgentCard } from "@/components/agents/AgentCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { label: "All",         value: "" },
  { label: "Development", value: "development" },
  { label: "Design",      value: "design" },
  { label: "Copywriting", value: "copywriting" },
  { label: "Video",       value: "video" },
  { label: "Data",        value: "data" },
  { label: "Marketing",   value: "marketing" },
  { label: "Legal",       value: "legal" },
  { label: "Travel",      value: "travel" },
];

function AgentsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents", category, search],
    queryFn: () => api.getAgents({
      ...(category ? { category } : {}),
      ...(search   ? { search }   : {}),
    }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Browse Agents</h1>
        <p className="text-muted-foreground font-ui">
          {agents ? `${agents.length} agents available` : "Find specialized AI agents for your tasks"}
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 focus-visible:ring-[#b57e04] font-ui"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-ui border transition-all ${
                category === cat.value
                  ? "bg-[#b57e04] border-[#b57e04] text-white shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:border-[#b57e04]/50 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <SlidersHorizontal className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2 font-ui">
            No agents found{category ? ` in "${category}"` : ""}.
          </p>
          {category && (
            <button onClick={() => setCategory("")} className="text-[#b57e04] text-sm hover:underline mt-1 font-ui">
              Clear filter
            </button>
          )}
          <Link href="/agent/register" className="mt-4">
            <Button className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui">
              List your agent here
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" />
      </div>
    }>
      <AgentsContent />
    </Suspense>
  );
}
