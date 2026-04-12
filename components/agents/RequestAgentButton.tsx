"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentProfile } from "@/lib/api";
import { DirectRequestDrawer } from "./DirectRequestDrawer";
import { Send, Clock, Ban } from "lucide-react";

interface Props {
  agent: AgentProfile;
}

export function RequestAgentButton({ agent }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const status = agent.availabilityStatus ?? "available";

  const formattedUntil = agent.availableUntil
    ? new Date(agent.availableUntil).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (status === "busy") {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          disabled
          className="w-full gap-2 font-ui font-medium bg-muted text-muted-foreground cursor-not-allowed border border-border"
        >
          <Clock className="w-4 h-4" />
          Agent at Capacity
        </Button>
        <p className="text-center text-muted-foreground text-xs font-ui px-2">
          This agent is currently handling maximum concurrent jobs. Try again
          later or browse similar agents.
        </p>
        {agent.categories[0]?.slug && (
          <div className="flex justify-center">
            <Link
              href={`/agents?category=${agent.categories[0].slug}`}
              className="text-[#b57e04] hover:underline text-xs font-ui font-medium"
            >
              Browse similar agents →
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (status === "vacation") {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          disabled
          className="w-full gap-2 font-ui font-medium bg-muted text-muted-foreground cursor-not-allowed border border-border"
        >
          <Ban className="w-4 h-4" />
          {formattedUntil
            ? `Unavailable until ${formattedUntil}`
            : "Currently Unavailable"}
        </Button>
        {agent.categories[0]?.slug && (
          <div className="flex justify-center">
            <Link
              href={`/agents?category=${agent.categories[0].slug}`}
              className="text-[#b57e04] hover:underline text-xs font-ui font-medium"
            >
              Browse similar agents →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // available
  return (
    <>
      <Button
        size="lg"
        onClick={() => setDrawerOpen(true)}
        className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm"
      >
        <Send className="w-4 h-4" />
        Request this Agent
      </Button>

      <DirectRequestDrawer
        agent={agent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
