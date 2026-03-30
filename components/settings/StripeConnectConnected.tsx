"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, StripeConnectStatus } from "@/lib/api";
import { CheckCircle, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  status: StripeConnectStatus;
  onRefetch: () => void;
}

export function StripeConnectConnected({ status, onRefetch }: Props) {
  const [copiedId, setCopiedId] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const { toast } = useToast();

  const copyAccountId = () => {
    navigator.clipboard.writeText(status.accountId ?? "");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const openDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const { url } = await api.getStripeConnectDashboardUrl();
      window.open(url, "_blank");
    } catch (err: unknown) {
      toast({
        title: "Failed to open dashboard",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectStripe();
      setShowDisconnectDialog(false);
      toast({ title: "Stripe account disconnected", variant: "success" });
      onRefetch();
    } catch (err: unknown) {
      toast({
        title: "Failed to disconnect",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const maskedAccountId = status.accountId
    ? `${status.accountId.slice(0, 8)}...${status.accountId.slice(-4)}`
    : null;

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-display font-semibold text-foreground">
            Stripe Account Connected
          </h3>
        </div>

        <div className="space-y-3 mb-5">
          <h4 className="text-sm font-medium text-foreground font-ui">Status</h4>
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-ui text-muted-foreground">Charges</span>
              <span className="text-xs font-ui font-medium text-emerald-600 dark:text-emerald-400">
                ● Enabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-ui text-muted-foreground">Payouts</span>
              <span className="text-xs font-ui font-medium text-emerald-600 dark:text-emerald-400">
                ● Enabled
              </span>
            </div>
            {status.accountId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-ui text-muted-foreground">Account ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{maskedAccountId}</span>
                  <button
                    onClick={copyAccountId}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy account ID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-5">
          <h4 className="text-sm font-medium text-foreground font-ui mb-1">Payout Schedule</h4>
          <p className="text-sm text-muted-foreground font-ui">
            Managed by Stripe. Funds are typically paid out within 2–7 business days of release.
          </p>
        </div>

        <Button
          onClick={openDashboard}
          disabled={loadingDashboard}
          variant="outline"
          className="w-full border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-2 font-ui"
        >
          {loadingDashboard ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          Open Stripe Dashboard
        </Button>
      </div>

      <div className="pt-1">
        <p className="text-xs text-muted-foreground font-ui mb-2">Need to disconnect?</p>
        <button
          onClick={() => setShowDisconnectDialog(true)}
          className="text-xs text-destructive hover:underline font-ui"
        >
          Disconnect Stripe Account
        </button>
      </div>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Stripe Account?</DialogTitle>
            <DialogDescription>
              Disconnecting will deactivate all your agents and pause any future payouts. Active
              contracts will not be affected. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="gap-2"
            >
              {disconnecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
