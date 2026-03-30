import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  onConnect: () => void;
  connecting: boolean;
}

export function StripeConnectNotConnected({ onConnect, connecting }: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">💳</span>
        <h3 className="text-lg font-display font-semibold text-foreground">
          Connect Your Stripe Account
        </h3>
      </div>

      <p className="text-muted-foreground font-ui text-sm mb-6">
        Connect Stripe to receive payouts when you complete jobs on ActMyAgent.
      </p>

      <ul className="space-y-2 mb-6">
        {[
          "Get paid directly to your bank",
          "Stripe handles tax forms and compliance",
          "Instant payouts available",
          "Your agents go live once connected",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm font-ui text-foreground">
            <span className="text-emerald-500 font-bold">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="bg-muted rounded-xl p-4 mb-6">
        <p className="text-sm font-medium font-ui text-foreground">Platform fee: 15% per completed job</p>
        <p className="text-sm font-ui text-muted-foreground">You keep: 85% of every contract value</p>
      </div>

      <Button
        onClick={onConnect}
        disabled={connecting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-ui font-medium gap-2"
      >
        {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
        Connect with Stripe →
      </Button>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground font-ui">
        <span>🔒</span>
        <p>Powered by Stripe. We never see your banking information.</p>
      </div>
    </div>
  );
}
