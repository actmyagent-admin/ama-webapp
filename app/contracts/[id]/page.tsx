"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { ChatPanel } from "@/components/contracts/ChatPanel";
import { DeliveryPanel } from "@/components/contracts/DeliveryPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Lock,
} from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";

// ─── Stripe payment form ─────────────────────────────────────────────────────
function PaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });
      if (error) {
        setError(error.message ?? "Payment failed");
      } else {
        onSuccess();
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
          onClick={onCancel}
          className="flex-1 border-border hover:border-[#b57e04] hover:text-[#b57e04] font-ui"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Pay & Secure Escrow
        </Button>
      </div>
    </form>
  );
}

// ─── Contract status badge ───────────────────────────────────────────────────
const CONTRACT_STATUS = {
  DRAFT: { label: "Draft", class: "bg-muted text-muted-foreground border-border" },
  SIGNED_BUYER: { label: "Awaiting Agent Signature", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  SIGNED_AGENT: { label: "Awaiting Your Signature", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  ACTIVE: { label: "Active", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const { profileId } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<{
    amountTotal: number;
    amountPlatformFee: number;
    amountAgentReceives: number;
    currency: string;
  } | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => api.getContract(id),
    enabled: !!id,
    // Only poll while the contract is in a transitional state (awaiting signatures / payment).
    // Once ACTIVE or terminal, stop polling to avoid unnecessary requests.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === "ACTIVE" || status === "COMPLETED" || status === "DISPUTED") {
        return false;
      }
      return 8000;
    },
  });

  // Use internal DB profileId for role checks (NOT Supabase user.id)
  const isBuyer = !!profileId && contract?.buyerId === profileId;
  const isAgent = !!profileId && contract?.agentProfile?.userId === profileId;

  const buyerSigned = contract?.buyerSignedAt !== null && contract?.buyerSignedAt !== undefined;
  const agentSigned = contract?.agentSignedAt !== null && contract?.agentSignedAt !== undefined;
  const hasSigned = isBuyer ? buyerSigned : agentSigned;
  const escrowPaid = !!contract?.payment && contract.payment.status !== "PENDING";

  const statusConfig = contract ? (CONTRACT_STATUS[contract.status] ?? CONTRACT_STATUS.ACTIVE) : null;

  const handleSign = async () => {
    if (!id) return;
    setSigning(true);
    try {
      await api.signContract(id);
      toast({ title: "Contract signed!", description: "Waiting for the other party." });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
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

  const handleOpenPayment = async () => {
    if (!id) return;
    try {
      const data = await api.createPayment(id);
      setClientSecret(data.clientSecret);
      setPaymentBreakdown({
        amountTotal: data.amountTotal,
        amountPlatformFee: data.amountPlatformFee,
        amountAgentReceives: data.amountAgentReceives,
        currency: data.currency,
      });
      setPaymentOpen(true);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    toast({ title: "Funds secured in escrow!", description: "The agent can now start working." });
    queryClient.invalidateQueries({ queryKey: ["contract", id] });
  };

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

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-bold text-foreground truncate">
              {contract.agentProfile?.name ?? "Contract"}
            </h1>
            {statusConfig && (
              <Badge className={`text-xs border flex-shrink-0 ml-3 ${statusConfig.class}`}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Mobile: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="contract">
            <TabsList className="bg-muted border border-border w-full mb-4">
              <TabsTrigger value="contract" className="flex-1 gap-1.5 text-xs font-ui">
                <FileText className="w-3.5 h-3.5" /> Contract
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs font-ui">
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1 gap-1.5 text-xs font-ui">
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
                signing={signing}
                onSign={handleSign}
                onPay={handleOpenPayment}
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
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: 3-column */}
        <div className="hidden lg:grid grid-cols-3 gap-5 h-[calc(100vh-12rem)]">
          {/* Left */}
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
                signing={signing}
                onSign={handleSign}
                onPay={handleOpenPayment}
              />
            </div>
          </div>

          {/* Center — Chat */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <ChatPanel contractId={id} />
          </div>

          {/* Right — Delivery */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <DeliveryPanel
              contractId={id}
              isAgent={isAgent}
              delivery={contract.delivery ?? undefined}
              escrowPaid={escrowPaid}
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#b57e04]" />
              Secure Payment to Escrow
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-ui">
              Funds are held securely and released only after you approve the delivery.
            </DialogDescription>
          </DialogHeader>
          {paymentBreakdown && (
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 space-y-2 text-sm font-ui">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You pay</span>
                <span className="text-foreground font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: paymentBreakdown.currency.toUpperCase(),
                  }).format(paymentBreakdown.amountTotal / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent receives</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: paymentBreakdown.currency.toUpperCase(),
                  }).format(paymentBreakdown.amountAgentReceives / 100)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Platform fee (15%)</span>
                <span className="text-muted-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: paymentBreakdown.currency.toUpperCase(),
                  }).format(paymentBreakdown.amountPlatformFee / 100)}
                </span>
              </div>
            </div>
          )}
          {clientSecret && (
            <Elements
              stripe={getStripe()}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={() => setPaymentOpen(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
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
  signing: boolean;
  onSign: () => void;
  onPay: () => void;
}) {
  const bothSigned = buyerSigned && agentSigned;

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

      {/* Pay button */}
      {isBuyer && bothSigned && !escrowPaid && (
        <Button
          onClick={onPay}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-ui font-medium"
        >
          <Lock className="w-4 h-4" />
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
