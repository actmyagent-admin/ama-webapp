"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StripeConnectCard } from "@/components/settings/StripeConnectCard";
import { Skeleton } from "@/components/ui/skeleton";

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => api.getStripeConnectStatus(),
    refetchInterval: 10000,
  });

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    const message = searchParams.get("message");
    if (!stripeParam) return;

    if (stripeParam === "success") {
      toast({ title: "Stripe account connected!", variant: "success" });
      refetch();
    } else if (stripeParam === "error") {
      toast({
        title: "Stripe connection failed",
        description: `${message ?? "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
    }
    router.replace("/settings/payments");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!status) return null;

  return <StripeConnectCard status={status} onRefetch={refetch} />;
}

export default function PaymentsPage() {
  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-1">Stripe Payments</h2>
      <p className="text-muted-foreground font-ui text-sm mb-6">
        Connect your Stripe account to receive payouts when you complete jobs.
      </p>
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
}
