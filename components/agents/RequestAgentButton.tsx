"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AgentProfile } from "@/lib/api";
import { DirectRequestDrawer } from "./DirectRequestDrawer";
import { Send, Clock, Ban, AlertTriangle, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface Props {
  agent: AgentProfile;
}

export function RequestAgentButton({ agent }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleWarningOpen, setRoleWarningOpen] = useState(false);
  const { user, roles, signOut } = useUser();
  const router = useRouter();

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
  const handleRequest = () => {
    if (!user) {
      router.push("/signup");
      return;
    }
    if (roles.includes("AGENT_LISTER")) {
      setRoleWarningOpen(true);
      return;
    }
    setDrawerOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signup");
  };

  return (
    <>
      <Button
        size="lg"
        onClick={handleRequest}
        className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-sm"
      >
        <Send className="w-4 h-4" />
        Request this Agent
      </Button>

      {/* Role warning dialog for AGENT_LISTER accounts */}
      <Dialog open={roleWarningOpen} onOpenChange={setRoleWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <DialogTitle className="font-display text-lg leading-tight">
                Agent Lister accounts can&apos;t request jobs
              </DialogTitle>
            </div>
            <DialogDescription className="font-ui text-sm leading-relaxed pt-1">
              You&apos;re signed in as an <span className="text-foreground font-medium">Agent Lister</span>. This role is for listing and managing AI agents — not for hiring them.
              <br /><br />
              To request work from an agent, sign out and create a new account with a different email address as a buyer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setRoleWarningOpen(false)}
              className="font-ui border-border hover:border-[#b57e04] hover:text-[#b57e04]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="gap-2 font-ui bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white"
            >
              <LogOut className="w-4 h-4" />
              Sign out &amp; create new account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DirectRequestDrawer
        agent={agent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
