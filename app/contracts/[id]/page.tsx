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
      <PaymentElement className="text-white" />
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-gray-700 text-gray-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
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
  PENDING_SIGNATURES: { label: "Awaiting Signatures", class: "bg-amber-900/50 text-amber-300 border-amber-800" },
  ACTIVE: { label: "Active", class: "bg-blue-900/50 text-blue-300 border-blue-800" },
  DELIVERED: { label: "Delivered", class: "bg-purple-900/50 text-purple-300 border-purple-800" },
  COMPLETED: { label: "Completed", class: "bg-emerald-900/50 text-emerald-300 border-emerald-800" },
  DISPUTED: { label: "Disputed", class: "bg-red-900/50 text-red-300 border-red-800" },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => api.getContract(id),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const isBuyer = contract?.buyerId === user?.id;
  const isAgent = contract?.agentId === user?.id;

  const hasSigned = isBuyer ? contract?.buyerSigned : contract?.agentSigned;
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
      const { clientSecret } = await api.createPayment(id);
      setClientSecret(clientSecret);
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
          <Skeleton key={i} className="h-96 bg-gray-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Contract not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white truncate">
              {contract.job?.title ?? "Contract"}
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
            <TabsList className="bg-gray-900 border border-gray-800 w-full mb-4">
              <TabsTrigger value="contract" className="flex-1 gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> Contract
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1 gap-1.5 text-xs">
                <Package className="w-3.5 h-3.5" /> Delivery
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contract">
              <ContractDetails
                contract={contract}
                isBuyer={isBuyer}
                isAgent={isAgent}
                hasSigned={!!hasSigned}
                signing={signing}
                onSign={handleSign}
                onPay={handleOpenPayment}
              />
            </TabsContent>
            <TabsContent value="chat">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl h-[500px]">
                <ChatPanel contractId={id} />
              </div>
            </TabsContent>
            <TabsContent value="delivery">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl h-[500px]">
                <DeliveryPanel
                  contractId={id}
                  isAgent={isAgent}
                  delivery={contract.delivery}
                  escrowPaid={contract.escrowPaid}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: 3-column */}
        <div className="hidden lg:grid grid-cols-3 gap-5 h-[calc(100vh-12rem)]">
          {/* Left */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-white font-semibold text-sm">Contract Details</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ContractDetails
                contract={contract}
                isBuyer={isBuyer}
                isAgent={isAgent}
                hasSigned={!!hasSigned}
                signing={signing}
                onSign={handleSign}
                onPay={handleOpenPayment}
              />
            </div>
          </div>

          {/* Center — Chat */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <ChatPanel contractId={id} />
          </div>

          {/* Right — Delivery */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <DeliveryPanel
              contractId={id}
              isAgent={isAgent}
              delivery={contract.delivery}
              escrowPaid={contract.escrowPaid}
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Secure Payment to Escrow
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Funds are held securely and released only after you approve the delivery.
            </DialogDescription>
          </DialogHeader>
          {clientSecret && (
            <Elements
              stripe={getStripe()}
              options={{ clientSecret, appearance: { theme: "night" } }}
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
  isAgent,
  hasSigned,
  signing,
  onSign,
  onPay,
}: {
  contract: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof api.getContract>>>>>["data"];
  isBuyer: boolean;
  isAgent: boolean;
  hasSigned: boolean;
  signing: boolean;
  onSign: () => void;
  onPay: () => void;
}) {
  if (!contract) return null;

  const bothSigned = contract.buyerSigned && contract.agentSigned;

  return (
    <div className="space-y-5">
      {/* Scope */}
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Scope</p>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {contract.scope || contract.job?.description || "—"}
        </p>
      </div>

      <Separator className="bg-gray-800" />

      {/* Price & deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Price</p>
          <p className="text-white font-semibold flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            {contract.price} {contract.currency}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Deadline</p>
          <p className="text-white font-semibold flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            {new Date(contract.deadline).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Separator className="bg-gray-800" />

      {/* Signature status */}
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Signatures</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Client</span>
            {contract.buyerSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Agent</span>
            {contract.agentSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-600">
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
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
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
      {isBuyer && bothSigned && !contract.escrowPaid && (
        <Button
          onClick={onPay}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          <Lock className="w-4 h-4" />
          Pay & Secure Escrow
        </Button>
      )}

      {contract.escrowPaid && (
        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900 rounded-lg px-4 py-2.5 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Funds secured in escrow
        </div>
      )}
    </div>
  );
}
