"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Lock } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { useTheme } from "next-themes";
import { api, ApiError } from "@/lib/api";

interface PayNowModalProps {
  contractId: string;
  amountTotal: number;
  currency: string;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({
  amountTotal,
  currency,
  onSuccess,
  onClose,
}: {
  amountTotal: number;
  currency: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100);

  // Auto-close after success
  useEffect(() => {
    if (succeeded) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [succeeded, onSuccess]);

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
        <p className="text-foreground font-semibold font-ui">Payment secured!</p>
        <p className="text-muted-foreground text-sm font-ui">
          Your agent has been notified and will begin work shortly.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href + "?payment=success",
        },
        redirect: "if_required",
      });
      if (stripeError) {
        setError(stripeError.message ?? "Payment failed");
      } else {
        setSucceeded(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-destructive text-sm font-ui">{error}</p>
      )}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-ui font-medium"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Pay {formattedAmount}
        </Button>
      </div>
    </form>
  );
}

export function PayNowModal({
  contractId,
  amountTotal,
  currency,
  open,
  onSuccess,
  onClose,
}: PayNowModalProps) {
  const { resolvedTheme } = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    amountTotal: number;
    amountPlatformFee: number;
    amountAgentReceives: number;
    currency: string;
  } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setBreakdown(null);
      setLoadError("");
      return;
    }
    setLoadingIntent(true);
    api
      .createPayment(contractId)
      .then((data) => {
        setClientSecret(data.clientSecret);
        setBreakdown({
          amountTotal: data.amountTotal,
          amountPlatformFee: data.amountPlatformFee,
          amountAgentReceives: data.amountAgentReceives,
          currency: data.currency,
        });
      })
      .catch((err: unknown) => {
        // 409 means payment already exists — treat as success so UI updates correctly
        if (err instanceof ApiError && err.status === 409) {
          onSuccess();
          return;
        }
        setLoadError((err as Error).message ?? "Failed to initialize payment");
      })
      .finally(() => setLoadingIntent(false));
  }, [open, contractId]);

  const isDark = resolvedTheme === "dark";

  const stripeAppearance = {
    theme: isDark ? ("night" as const) : ("stripe" as const),
    variables: isDark
      ? {
          colorPrimary: "#6366f1",
          colorBackground: "#111827",
        }
      : {
          colorPrimary: "#6366f1",
        },
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (breakdown?.currency ?? currency).toUpperCase(),
    }).format(amount / 100);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            Pay &amp; Secure Escrow
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-ui">
            Funds are held securely and released only after you approve the delivery.
          </DialogDescription>
        </DialogHeader>

        {breakdown && (
          <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 space-y-2 text-sm font-ui">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You pay</span>
              <span className="text-foreground font-semibold">{fmt(breakdown.amountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent receives</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {fmt(breakdown.amountAgentReceives)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Platform fee (15%)</span>
              <span className="text-muted-foreground">{fmt(breakdown.amountPlatformFee)}</span>
            </div>
          </div>
        )}

        {loadingIntent && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {loadError && (
          <p className="text-destructive text-sm font-ui">{loadError}</p>
        )}

        {clientSecret && breakdown && (
          <Elements
            stripe={getStripe()}
            options={{ clientSecret, appearance: stripeAppearance }}
          >
            <PaymentForm
              amountTotal={breakdown.amountTotal}
              currency={breakdown.currency}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
