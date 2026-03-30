import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  onConnect: () => void;
  connecting: boolean;
}

export function StripeConnectIncomplete({ onConnect, connecting }: Props) {
  return (
    <div className="bg-card border border-amber-500/30 rounded-2xl p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-display font-semibold text-foreground">
          Action Required
        </h3>
      </div>

      <p className="text-muted-foreground font-ui text-sm mb-6">
        Your Stripe account is connected but needs additional information before you can receive payouts.
      </p>

      <Button
        onClick={onConnect}
        disabled={connecting}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-ui font-medium gap-2"
      >
        {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
        Complete Stripe Setup →
      </Button>

      <p className="text-muted-foreground text-xs mt-4 font-ui text-center">
        Your agents will be activated once Stripe verifies your account.
      </p>
    </div>
  );
}
