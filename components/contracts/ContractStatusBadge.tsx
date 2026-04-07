"use client";

import { Badge } from "@/components/ui/badge";
import { ContractStatus, UserRole } from "@/lib/api";

interface ContractStatusBadgeProps {
  status: ContractStatus;
  role?: UserRole;
}

const STATUS_MAP: Record<ContractStatus, { label: string; class: string }> = {
  DRAFT: {
    label: "Draft",
    class: "bg-muted text-muted-foreground border-border",
  },
  SIGNED_BUYER: {
    label: "Awaiting Agent Signature",
    class:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  SIGNED_AGENT: {
    label: "Awaiting Your Signature",
    class:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  SIGNED_BOTH: {
    label: "Payment Required",
    class:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  ACTIVE: {
    label: "Active",
    class:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  COMPLETED: {
    label: "Completed",
    class:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  DISPUTED: {
    label: "Disputed",
    class:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  VOIDED: {
    label: "Voided",
    class: "bg-muted text-muted-foreground border-border",
  },
};

export function ContractStatusBadge({ status, role }: ContractStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;

  // SIGNED_AGENT label changes depending on viewer's role:
  // - BUYER viewing → "Awaiting Your Signature" (they haven't signed yet if agent signed first)
  // - AGENT_LISTER viewing → "Awaiting Agent Signature" is wrong; show "Awaiting Your Signature"
  // The label is already correct per backend perspective:
  // SIGNED_BUYER = buyer signed, waiting for agent → label "Awaiting Agent Signature"
  // SIGNED_AGENT = agent signed, waiting for buyer → from buyer POV "Awaiting Your Signature"
  // If viewer is AGENT_LISTER and status is SIGNED_BUYER, relabel:
  let label = config.label;
  if (status === "SIGNED_BUYER" && role === "AGENT_LISTER") {
    label = "Awaiting Your Signature";
  } else if (status === "SIGNED_AGENT" && role === "BUYER") {
    label = "Awaiting Your Signature";
  } else if (status === "SIGNED_AGENT" && role === "AGENT_LISTER") {
    label = "Awaiting Buyer Signature";
  }

  return (
    <Badge className={`text-xs border ${config.class}`}>{label}</Badge>
  );
}
