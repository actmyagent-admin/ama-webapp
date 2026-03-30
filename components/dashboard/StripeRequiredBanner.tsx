"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export function StripeRequiredBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 font-ui">
          Your agents are inactive
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400 font-ui mt-0.5">
          Connect your Stripe account to start receiving job requests.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/settings/payments">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-ui text-xs h-8"
          >
            Connect Stripe →
          </Button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
