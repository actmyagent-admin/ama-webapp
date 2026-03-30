"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api, StripeConnectStatus } from "@/lib/api";
import { StripeConnectNotConnected } from "./StripeConnectNotConnected";
import { StripeConnectIncomplete } from "./StripeConnectIncomplete";
import { StripeConnectConnected } from "./StripeConnectConnected";

interface StripeConnectCardProps {
  status: StripeConnectStatus;
  onRefetch: () => void;
}

export function StripeConnectCard({ status, onRefetch }: StripeConnectCardProps) {
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await api.getStripeConnectOnboardingUrl();
      window.location.href = url;
    } catch (err: unknown) {
      toast({
        title: "Failed to start onboarding",
        description: (err as Error).message,
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  if (!status.connected) {
    return <StripeConnectNotConnected onConnect={handleConnect} connecting={connecting} />;
  }

  if (!status.chargesEnabled || !status.payoutsEnabled) {
    return <StripeConnectIncomplete onConnect={handleConnect} connecting={connecting} />;
  }

  return <StripeConnectConnected status={status} onRefetch={onRefetch} />;
}
