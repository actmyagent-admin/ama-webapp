"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { ChatPanel } from "@/components/contracts/ChatPanel";
import { DeliveryPanel } from "@/components/contracts/DeliveryPanel";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { PaymentDeadlineCountdown } from "@/components/contracts/PaymentDeadlineCountdown";
import { PayNowModal } from "@/components/contracts/PayNowModal";
import { VoidedContractState } from "@/components/contracts/VoidedContractState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  MessageSquare,
  Package,
  DollarSign,
  Calendar,
  PenLine,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profileId } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [signConfirmOpen, setSignConfirmOpen] = useState(false);
  const [payNowOpen, setPayNowOpen] = useState(false);

  // Contract details (full object with messages, delivery, payment)
  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => api.getContract(id),
    enabled: !!id,
  });

  // Lightweight status polling
  const { data: contractStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["contract-status", id],
    queryFn: () => api.getContractStatus(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "SIGNED_BOTH") return 5000;
      if (status === "ACTIVE") return 30000;
      return false;
    },
  });

  // Derived role/state from contract details
  const isBuyer = !!profileId && contract?.buyerId === profileId;
  const isAgent = !!profileId && contract?.agentProfile?.userId === profileId;
  const userRole = isBuyer ? "BUYER" : "AGENT_LISTER";

  const buyerSigned = !!contract?.buyerSignedAt;
  const agentSigned = !!contract?.agentSignedAt;
  const hasSigned = isBuyer ? buyerSigned : agentSigned;

  // Use status from the polling endpoint when available; fall back to contract object
  const currentStatus = contractStatus?.status ?? contract?.status;
  const escrowPaid = contractStatus?.payment.secured ?? (!!contract?.payment && contract.payment.status !== "PENDING");

  // Handle ?payment=success on mount
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast({ title: "Payment confirmed!", description: "Agent notified. Contract is now active." });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      // Clear the query param
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      router.replace(url.pathname, { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignConfirmed = async () => {
    if (!id) return;
    setSignConfirmOpen(false);
    setSigning(true);
    try {
      await api.signContract(id);
      toast({ title: "Contract signed!", description: "Waiting for the other party." });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      refetchStatus();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to sign contract",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const handlePaySuccess = useCallback(() => {
    setPayNowOpen(false);
    toast({ title: "Funds secured in escrow!", description: "The agent can now start working." });
    queryClient.invalidateQueries({ queryKey: ["contract", id] });
    refetchStatus();
  }, [id, queryClient, refetchStatus, toast]);

  const handleCountdownExpired = useCallback(() => {
    refetchStatus();
    queryClient.invalidateQueries({ queryKey: ["contract", id] });
  }, [id, queryClient, refetchStatus]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground font-ui">Contract not found.</p>
      </div>
    );
  }

  // Voided state — replace page entirely
  if (currentStatus === "VOIDED") {
    return (
      <VoidedContractState
        role={userRole}
        jobId={contract.jobId}
      />
    );
  }

  const panelsDimmed = currentStatus === "SIGNED_BOTH";

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-bold text-foreground truncate">
              {contract.agentProfile?.name ?? "Contract"}
            </h1>
            {currentStatus && (
              <div className="flex-shrink-0 ml-3">
                <ContractStatusBadge status={currentStatus} role={userRole} />
              </div>
            )}
          </div>
        </div>

        {/* Payment deadline banner */}
        {currentStatus === "SIGNED_BOTH" &&
          contractStatus?.timing.paymentDeadline && (
            <PaymentDeadlineCountdown
              deadline={contractStatus.timing.paymentDeadline}
              amountTotal={contractStatus.payment.amountTotal ?? (contract.price * 100)}
              currency={contractStatus.payment.currency ?? contract.currency}
              role={userRole}
              onPayNow={() => setPayNowOpen(true)}
              onExpired={handleCountdownExpired}
            />
          )}

        {/* Mobile: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="contract">
            <TabsList className="bg-muted border border-border w-full mb-4">
              <TabsTrigger value="contract" className="flex-1 gap-1.5 text-xs font-ui">
                <FileText className="w-3.5 h-3.5" /> Contract
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs font-ui" disabled={panelsDimmed}>
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1 gap-1.5 text-xs font-ui" disabled={panelsDimmed}>
                <Package className="w-3.5 h-3.5" /> Delivery
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contract">
              <ContractDetails
                contract={contract}
                isBuyer={isBuyer}
                hasSigned={hasSigned}
                buyerSigned={buyerSigned}
                agentSigned={agentSigned}
                escrowPaid={escrowPaid}
                currentStatus={currentStatus}
                signing={signing}
                onSign={() => setSignConfirmOpen(true)}
                onPay={() => setPayNowOpen(true)}
              />
            </TabsContent>
            <TabsContent value="chat">
              <div className="bg-card border border-border rounded-2xl h-[500px]">
                <ChatPanel contractId={id} />
              </div>
            </TabsContent>
            <TabsContent value="delivery">
              <div className="bg-card border border-border rounded-2xl h-[500px]">
                <DeliveryPanel
                  contractId={id}
                  isAgent={isAgent}
                  delivery={contract.delivery ?? undefined}
                  escrowPaid={escrowPaid}
                  bothSigned={buyerSigned && agentSigned}
                  onPay={isBuyer && !escrowPaid ? () => setPayNowOpen(true) : undefined}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: 3-column */}
        <div className="hidden lg:grid grid-cols-3 gap-5 h-[calc(100vh-12rem)]">
          {/* Left — Contract details */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-semibold text-sm font-ui">Contract Details</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ContractDetails
                contract={contract}
                isBuyer={isBuyer}
                hasSigned={hasSigned}
                buyerSigned={buyerSigned}
                agentSigned={agentSigned}
                escrowPaid={escrowPaid}
                currentStatus={currentStatus}
                signing={signing}
                onSign={() => setSignConfirmOpen(true)}
                onPay={() => setPayNowOpen(true)}
              />
            </div>
          </div>

          {/* Center — Chat */}
          <div
            className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative ${panelsDimmed ? "opacity-50 pointer-events-none" : ""}`}
            title={panelsDimmed ? "Available once contract is active" : undefined}
          >
            <ChatPanel contractId={id} />
          </div>

          {/* Right — Delivery */}
          <div
            className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative ${panelsDimmed ? "opacity-50 pointer-events-none" : ""}`}
            title={panelsDimmed ? "Available once contract is active" : undefined}
          >
            <DeliveryPanel
              contractId={id}
              isAgent={isAgent}
              delivery={contract.delivery ?? undefined}
              escrowPaid={escrowPaid}
            />
          </div>
        </div>
      </div>

      {/* Sign confirmation dialog */}
      <Dialog open={signConfirmOpen} onOpenChange={setSignConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              Sign Agreement
            </DialogTitle>
            <DialogDescription className="sr-only">Legal agreement confirmation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3.5">
              <p className="text-sm text-amber-900 dark:text-amber-300 font-ui leading-relaxed">
                <span className="font-semibold">You are about to sign a legally binding agreement.</span> By proceeding, you confirm that you have read and understood the contract terms, including scope, deliverables, price, and deadline. This signature may be used for legal purposes in the event of a dispute.
              </p>
            </div>
            <p className="text-sm text-muted-foreground font-ui leading-relaxed">
              As {isBuyer ? "the client" : "the agent"}, your signature indicates your commitment to fulfil your obligations under this contract. Proceed only if you agree to all terms.
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setSignConfirmOpen(false)}
                className="flex-1 border-border font-ui"
              >
                Review Again
              </Button>
              <Button
                onClick={handleSignConfirmed}
                disabled={signing}
                className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium gap-2"
              >
                {signing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PenLine className="w-4 h-4" />
                )}
                I Agree — Sign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Now modal */}
      {isBuyer && (
        <PayNowModal
          contractId={id}
          amountTotal={contractStatus?.payment.amountTotal ?? contract.price * 100}
          currency={contractStatus?.payment.currency ?? contract.currency}
          open={payNowOpen}
          onSuccess={handlePaySuccess}
          onClose={() => setPayNowOpen(false)}
        />
      )}
    </>
  );
}

// ─── Contract details panel ───────────────────────────────────────────────────
function ContractDetails({
  contract,
  isBuyer,
  hasSigned,
  buyerSigned,
  agentSigned,
  escrowPaid,
  currentStatus,
  signing,
  onSign,
  onPay,
}: {
  contract: Awaited<ReturnType<typeof api.getContract>>;
  isBuyer: boolean;
  hasSigned: boolean;
  buyerSigned: boolean;
  agentSigned: boolean;
  escrowPaid: boolean;
  currentStatus: string | undefined;
  signing: boolean;
  onSign: () => void;
  onPay: () => void;
}) {
  const bothSigned = buyerSigned && agentSigned;
  const needsPayment = currentStatus === "SIGNED_BOTH" && isBuyer && !escrowPaid;

  return (
    <div className="space-y-5">
      {/* Agent */}
      {contract.agentProfile && (
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Agent</p>
          <p className="text-foreground font-medium font-ui">{contract.agentProfile.name}</p>
          {contract.agentProfile.description && (
            <p className="text-muted-foreground text-xs mt-0.5 font-ui line-clamp-2">
              {contract.agentProfile.description}
            </p>
          )}
        </div>
      )}

      <Separator className="bg-border" />

      {/* Scope */}
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">Scope</p>
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-ui">
          {contract.scope}
        </p>
      </div>

      {/* Deliverables */}
      {contract.deliverables && (
        <>
          <Separator className="bg-border" />
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">
              Deliverables
            </p>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-ui">
              {contract.deliverables}
            </p>
          </div>
        </>
      )}

      <Separator className="bg-border" />

      {/* Price & deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Price</p>
          <p className="text-foreground font-semibold flex items-center gap-1 font-ui">
            <DollarSign className="w-4 h-4 text-[#b57e04]" />
            {contract.price} {contract.currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1 font-ui">Deadline</p>
          <p className="text-foreground font-semibold flex items-center gap-1 font-ui">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {new Date(contract.deadline).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Signature status */}
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3 font-ui">Signatures</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-ui">Client</span>
            {buyerSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-ui">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground font-ui">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-ui">Agent</span>
            {agentSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-ui">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground font-ui">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sign button */}
      {!hasSigned && (
        <Button
          onClick={onSign}
          disabled={signing}
          className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
        >
          {signing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PenLine className="w-4 h-4" />
          )}
          Sign as {isBuyer ? "Client" : "Agent"}
        </Button>
      )}

      {/* Pay button — shown in sidebar for SIGNED_BOTH buyers (countdown also has one) */}
      {needsPayment && !bothSigned && null}
      {needsPayment && (
        <Button
          onClick={onPay}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-ui font-medium"
        >
          Pay & Secure Escrow
        </Button>
      )}

      {escrowPaid && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 rounded-lg px-4 py-2.5 text-emerald-700 dark:text-emerald-400 text-sm font-ui">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Funds secured in escrow
        </div>
      )}
    </div>
  );
}
