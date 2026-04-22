"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, JobAttachment } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Paperclip,
  Download,
  X,
  ImageIcon,
  Film,
  ExternalLink,
  Tag,
  Zap,
  Globe,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { generateContractPdf } from "@/lib/generateContractPdf";

const ACCEPTED_ATTR = "image/*,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.txt";
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

function extIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <ImageIcon className="w-3.5 h-3.5" />;
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return <Film className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profileId, user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [signConfirmOpen, setSignConfirmOpen] = useState(false);
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [paymentJustSucceeded, setPaymentJustSucceeded] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => api.getContract(id),
    enabled: !!id,
  });

  const statusPollAttempts = useRef(0);
  const [pollExhausted, setPollExhausted] = useState(false);

  const { data: contractStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["contract-status", id],
    queryFn: () => {
      statusPollAttempts.current += 1;
      if (statusPollAttempts.current >= 10) setPollExhausted(true);
      return api.getContractStatus(id);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (statusPollAttempts.current >= 10) return false;
      if (status === "SIGNED_BOTH" || status === "ACTIVE") return 30000;
      return false;
    },
  });

  const handleReloadStatus = () => window.location.reload();

  const isInhouse = contract?.isInhouse ?? false;
  // Wait for auth to resolve before computing role — avoids AGENT_LISTER flash on initial load
  const isBuyer = !userLoading && !!profileId && contract?.buyerId === profileId;
  const isAgent = !userLoading && !!profileId && contract?.agentProfile?.userId === profileId;
  const userRole = isBuyer ? "BUYER" : "AGENT_LISTER";

  const inhouseOrder = contract?.inhouseOrder ?? null;

  const buyerSigned = !!contract?.buyerSignedAt;
  const agentSigned = !!contract?.agentSignedAt;
  const hasSigned = isBuyer ? buyerSigned : agentSigned;

  const currentStatus = contractStatus?.status ?? contract?.status;
  const escrowPaid = paymentJustSucceeded || contractStatus?.payment.secured || (!!contract?.payment && contract.payment.status === "ESCROWED");

  const isTimedOut =
    contractStatus?.status === "SIGNED_BOTH" &&
    contractStatus?.timing.paymentDeadlineHoursRemaining === 0 &&
    !!contractStatus?.timing.contractDeadline &&
    new Date(contractStatus.timing.contractDeadline) < new Date();

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast({ title: "Payment confirmed!", description: "Agent notified. Contract is now active." });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
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
      toast({ title: "Error", description: (err as Error).message ?? "Failed to sign contract", variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  const handlePaySuccess = useCallback(() => {
    setPayNowOpen(false);
    setPaymentJustSucceeded(true);
    toast({ title: "Funds secured in escrow!", description: "The agent can now start working." });
    queryClient.invalidateQueries({ queryKey: ["contract", id] });
    refetchStatus();
  }, [id, queryClient, refetchStatus, toast]);

  const handleCountdownExpired = useCallback(() => {
    refetchStatus();
    queryClient.invalidateQueries({ queryKey: ["contract", id] });
  }, [id, queryClient, refetchStatus]);

  const handleDownloadPdf = useCallback(async () => {
    if (!contract) return;
    await generateContractPdf({
      contractId: contract.id,
      createdAt: contract.createdAt,
      status: contract.status,
      scope: contract.scope ?? "",
      deliverables: contract.deliverables ?? null,
      price: contract.price,
      currency: contract.currency,
      deadline: contract.deadline,
      agreedDeliveryDays: contract.agreedDeliveryDays ?? 3,
      agreedRevisionsIncluded: contract.agreedRevisionsIncluded ?? 2,
      agentName: contract.agentProfile?.name ?? "Agent",
      agentEmail: (contract.agentProfile?.user as { email?: string } | undefined)?.email ?? null,
      agentSignedAt: contract.agentSignedAt ?? null,
      buyerName: isBuyer ? (user?.user_metadata?.full_name ?? user?.email ?? null) : "Client",
      buyerEmail: isBuyer ? (user?.email ?? null) : null,
      buyerSignedAt: contract.buyerSignedAt ?? null,
      isInhouse,
      orderId: inhouseOrder?.id,
      jobTitle: contract.job?.title ?? "—",
    });
  }, [contract, user, isBuyer, isInhouse, inhouseOrder]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
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

  if (currentStatus === "VOIDED") {
    return <VoidedContractState role={userRole} jobId={contract.jobId} />;
  }

  // For inhouse direct orders the chat/delivery panels stay enabled even while
  // payment is pending — both parties can communicate before escrow clears.
  const panelsDimmed = !isInhouse && currentStatus === "SIGNED_BOTH";
  const job = contract.job;
  const attachments: JobAttachment[] = isInhouse
    ? (inhouseOrder?.attachments ?? [])
    : (job?.attachments ?? []);
  const contractDetailsProps = {
    contract,
    isBuyer,
    hasSigned,
    buyerSigned,
    agentSigned,
    escrowPaid,
    currentStatus,
    signing,
    isTimedOut,
    onSign: () => setSignConfirmOpen(true),
    onPay: () => setPayNowOpen(true),
    contractId: id,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-4">
          <Link
            href={isBuyer ? "/dashboard/buyer" : "/dashboard/agent"}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-ui mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-display font-bold text-foreground truncate">
              {contract.agentProfile?.name ?? "Contract"}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentStatus && (
                <ContractStatusBadge status={currentStatus} role={userRole} />
              )}
              {(contract.buyerSignedAt && contract.agentSignedAt) && (
                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-1.5 font-ui font-medium h-8 px-3 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Contract
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status polling exhausted */}
        {pollExhausted && !escrowPaid && (
          <div className="flex items-center justify-between gap-3 bg-muted border border-border rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-muted-foreground font-ui">
              Auto-refresh paused. Reload to check the latest contract status.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReloadStatus}
              className="flex-shrink-0 border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 font-ui text-xs h-7 px-3"
            >
              Reload
            </Button>
          </div>
        )}

        {/* Contract timed out */}
        {isTimedOut && (
          <div className="flex items-start gap-3 bg-destructive/8 border border-destructive/25 rounded-xl px-4 py-3.5 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-destructive font-semibold text-sm font-ui">Contract timed out due to non-payment</p>
              <p className="text-destructive/80 text-xs font-ui mt-0.5">
                The payment deadline passed without funds being secured in escrow. This contract is no longer active.
              </p>
            </div>
          </div>
        )}

        {/* Payment deadline banner */}
        {!isTimedOut && currentStatus === "SIGNED_BOTH" && contractStatus?.timing.paymentDeadline && (
          <PaymentDeadlineCountdown
            deadline={contractStatus.timing.paymentDeadline}
            amountTotal={contractStatus.payment.amountTotal ?? (contract.price * 100)}
            currency={contractStatus.payment.currency ?? contract.currency}
            role={userRole}
            onPayNow={() => setPayNowOpen(true)}
            onExpired={handleCountdownExpired}
          />
        )}

        {/* ── Job context bar — full width, above panels ── */}
        <div className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
          {/* Job / Order title row */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wide leading-none mb-0.5">
                  {isInhouse ? "Order" : "Job"}
                </p>
                <p className="text-sm font-semibold font-ui text-foreground truncate">
                  {isInhouse
                    ? (inhouseOrder?.service?.packageName ?? "Direct Order")
                    : (job?.title ?? "—")}
                </p>
              </div>
            </div>
            {(isInhouse ? !!inhouseOrder : !!job) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobDetailsOpen(true)}
                className="flex-shrink-0 border-border hover:border-[#b57e04] hover:text-[#b57e04] gap-1.5 font-ui text-xs h-7 px-2.5"
              >
                <Eye className="w-3.5 h-3.5" /> View Details
              </Button>
            )}
          </div>

          {/* Attachments row */}
          <div className="px-5 py-4">
            <AttachmentsSection
              attachments={attachments}
              isBuyer={isBuyer}
              jobId={job?.id ?? contract.jobId}
              contractId={id}
              readOnly={isInhouse}
            />
          </div>
        </div>

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
              <ContractDetails {...contractDetailsProps} />
            </TabsContent>
            <TabsContent value="chat">
              <div className="bg-card border border-border rounded-2xl h-[900px]">
                <ChatPanel contractId={id} />
              </div>
            </TabsContent>
            <TabsContent value="delivery">
              <div className="bg-card border border-border rounded-2xl h-[900px]">
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
        <div className="hidden lg:grid grid-cols-3 gap-5 h-[700px]">
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-semibold text-sm font-ui">Contract Details</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ContractDetails {...contractDetailsProps} hideActions />
            </div>
            {/* Sticky action footer — always visible */}
            {(!hasSigned && !isTimedOut) || (currentStatus === "SIGNED_BOTH" && isBuyer && !escrowPaid && !isTimedOut) || escrowPaid ? (
              <div className="border-t border-border p-4 bg-card flex flex-col gap-2">
                {!hasSigned && !isTimedOut && (
                  <Button
                    onClick={() => setSignConfirmOpen(true)}
                    disabled={signing}
                    className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
                  >
                    {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                    Sign as {isBuyer ? "Client" : "Agent"}
                  </Button>
                )}
                {currentStatus === "SIGNED_BOTH" && isBuyer && !escrowPaid && !isTimedOut && (
                  <Button onClick={() => setPayNowOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-ui font-medium">
                    Pay & Secure Escrow
                  </Button>
                )}
                {escrowPaid && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 rounded-lg px-4 py-2.5 text-emerald-700 dark:text-emerald-400 text-sm font-ui">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Funds secured in escrow
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div
            className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative ${panelsDimmed ? "opacity-50 pointer-events-none" : ""}`}
            title={panelsDimmed ? "Available once contract is active" : undefined}
          >
            <ChatPanel contractId={id} />
          </div>

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
                <span className="font-semibold">You are about to sign a legally binding agreement.</span> By proceeding, you confirm that you have read and understood the contract terms, including scope, deliverables, price, and deadline.
              </p>
            </div>
            <p className="text-sm text-muted-foreground font-ui leading-relaxed">
              As {isBuyer ? "the client" : "the agent"}, your signature indicates your commitment to fulfil your obligations under this contract.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setSignConfirmOpen(false)} className="flex-1 border-border font-ui">
                Review Again
              </Button>
              <Button
                onClick={handleSignConfirmed}
                disabled={signing}
                className="flex-1 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium gap-2"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
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

      {/* View Job / Order dialog */}
      {isInhouse && inhouseOrder ? (
        <OrderDetailsDialog
          open={jobDetailsOpen}
          onClose={() => setJobDetailsOpen(false)}
          order={inhouseOrder}
        />
      ) : contract.job ? (
        <JobDetailsDialog
          open={jobDetailsOpen}
          onClose={() => setJobDetailsOpen(false)}
          job={contract.job}
        />
      ) : null}
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
  isTimedOut,
  onSign,
  onPay,
  hideActions,
}: {
  contract: Awaited<ReturnType<typeof api.getContract>>;
  isBuyer: boolean;
  hasSigned: boolean;
  buyerSigned: boolean;
  agentSigned: boolean;
  escrowPaid: boolean;
  currentStatus: string | undefined;
  signing: boolean;
  isTimedOut: boolean;
  onSign: () => void;
  onPay: () => void;
  hideActions?: boolean;
}) {
  const needsPayment = currentStatus === "SIGNED_BOTH" && isBuyer && !escrowPaid && !isTimedOut;

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
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-ui">{contract.scope}</p>
      </div>

      {/* Deliverables */}
      {contract.deliverables && (
        <>
          <Separator className="bg-border" />
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-ui">Deliverables</p>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-ui">{contract.deliverables}</p>
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

      {/* Signatures */}
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3 font-ui">Signatures</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-ui">Client</span>
            {buyerSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-ui"><CheckCircle className="w-4 h-4" /> Signed</span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground font-ui"><Clock className="w-4 h-4" /> Pending</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-ui">Agent</span>
            {agentSigned ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-ui"><CheckCircle className="w-4 h-4" /> Signed</span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground font-ui"><Clock className="w-4 h-4" /> Pending</span>
            )}
          </div>
        </div>
      </div>

      {/* Sign button */}
      {!hideActions && !hasSigned && !isTimedOut && (
        <Button
          onClick={onSign}
          disabled={signing}
          className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium"
        >
          {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          Sign as {isBuyer ? "Client" : "Agent"}
        </Button>
      )}

      {!hideActions && needsPayment && (
        <Button onClick={onPay} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-ui font-medium">
          Pay & Secure Escrow
        </Button>
      )}

      {!hideActions && escrowPaid && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 rounded-lg px-4 py-2.5 text-emerald-700 dark:text-emerald-400 text-sm font-ui">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Funds secured in escrow
        </div>
      )}
    </div>
  );
}

// ─── Attachments section ──────────────────────────────────────────────────────
function AttachmentsSection({
  attachments,
  isBuyer,
  jobId,
  contractId,
  readOnly,
}: {
  attachments: JobAttachment[];
  isBuyer: boolean;
  jobId: string;
  contractId: string;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contract", contractId] });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (attachments.length + arr.length > MAX_ATTACHMENTS) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_ATTACHMENTS} attachments per job`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File too large", description: `${file.name} exceeds 100 MB`, variant: "destructive" });
          continue;
        }
        const { uploadUrl, key } = await api.getJobUploadUrl({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          jobId,
        });
        await api.uploadToS3(uploadUrl, file);
        await api.addJobAttachment(jobId, key, file.name);
        invalidate();
      }
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (key: string) => {
    setRemovingKey(key);
    try {
      await api.removeJobAttachment(jobId, key);
      invalidate();
    } catch (err: unknown) {
      toast({ title: "Remove failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRemovingKey(null);
    }
  };

  const hasAttachments = attachments.length > 0;
  const canAdd = isBuyer && attachments.length < MAX_ATTACHMENTS && !readOnly;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wide font-ui">
          Attachments{hasAttachments ? ` (${attachments.length})` : ""}
          {readOnly && hasAttachments && (
            <span className="ml-1.5 text-[10px] normal-case text-muted-foreground/70">(submitted with order)</span>
          )}
        </p>
        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-[#b57e04] hover:underline font-ui"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
            {uploading ? "Uploading..." : "Add file"}
          </button>
        )}
      </div>

      {!readOnly && isBuyer && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_ATTR}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      )}

      {!hasAttachments ? (
        !readOnly && isBuyer ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-border hover:border-[#b57e04] rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-[#b57e04] transition-colors font-ui"
          >
            <Paperclip className="w-3.5 h-3.5" /> Add reference files for the agent
          </button>
        ) : (
          <p className="text-xs text-muted-foreground font-ui italic">No attachments</p>
        )
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div key={att.key} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
              <span className="text-muted-foreground flex-shrink-0">{extIcon(att.filename)}</span>
              <span className="text-xs font-ui text-foreground flex-1 truncate">{att.filename}</span>
              {att.url ? (
                <a
                  href={att.url}
                  download={att.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 p-0.5 text-muted-foreground hover:text-[#b57e04] transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              ) : null}
              {!readOnly && isBuyer && (
                <button
                  onClick={() => handleRemove(att.key)}
                  disabled={removingKey === att.key}
                  className="flex-shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove"
                >
                  {removingKey === att.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Job details dialog ───────────────────────────────────────────────────────
function JobDetailsDialog({
  open,
  onClose,
  job,
}: {
  open: boolean;
  onClose: () => void;
  job: NonNullable<Awaited<ReturnType<typeof api.getContract>>["job"]>;
}) {
  const STATUS_CLASS: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    DISPUTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    CANCELLED: "bg-muted text-muted-foreground border-border",
  };
  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Open", IN_PROGRESS: "In Progress", COMPLETED: "Completed", DISPUTED: "Disputed", CANCELLED: "Cancelled",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display leading-snug pr-6">{job.title}</DialogTitle>
          <DialogDescription className="sr-only">Job details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs border ${STATUS_CLASS[job.status] ?? STATUS_CLASS.OPEN}`}>
              {STATUS_LABEL[job.status] ?? job.status}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
              <Tag className="w-3 h-3" /> <span className="capitalize">{job.categoryRef?.name ?? job.category}</span>
            </span>
            {job.budget != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
                <DollarSign className="w-3 h-3" /> ${job.budget} {job.currency}
              </span>
            )}
            {job.deadline && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
                <Calendar className="w-3 h-3" /> {new Date(job.deadline).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Description</p>
            <p className="text-foreground text-sm leading-relaxed font-ui">{job.description}</p>
          </div>

          {/* Extended brief */}
          {job.briefDetail && (
            <div className="bg-muted/50 rounded-xl p-3.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Extended Brief</p>
              <p className="text-foreground text-sm leading-relaxed font-ui">{job.briefDetail}</p>
            </div>
          )}

          {/* Preferences row */}
          {(job.expressRequested || job.budgetFlexible || job.preferHuman || job.desiredDeliveryDays || job.requiredLanguage) && (
            <div className="flex flex-wrap gap-1.5">
              {job.expressRequested && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 rounded-full px-2 py-0.5 font-ui">
                  <Zap className="w-3 h-3" /> Urgent
                </span>
              )}
              {job.budgetFlexible && (
                <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-ui">
                  <DollarSign className="w-3 h-3" /> Budget flexible
                </span>
              )}
              {job.preferHuman && (
                <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-ui">
                  Prefer human
                </span>
              )}
              {job.desiredDeliveryDays && (
                <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-ui">
                  <Clock className="w-3 h-3" /> {job.desiredDeliveryDays}-day turnaround
                </span>
              )}
              {job.requiredLanguage && (
                <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-ui">
                  <Globe className="w-3 h-3" /> {job.requiredLanguage}
                </span>
              )}
              {job.preferredOutputFormats && job.preferredOutputFormats.length > 0 && (
                <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-ui">
                  {job.preferredOutputFormats.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Example URLs */}
          {job.exampleUrls && job.exampleUrls.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Style References</p>
              <div className="space-y-1">
                {job.exampleUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#b57e04] hover:underline font-ui truncate">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" /> {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Attachments (read-only in this dialog) */}
          {job.attachments && job.attachments.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Attachments</p>
              <div className="space-y-1.5">
                {job.attachments.map((att) => (
                  <div key={att.key} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground flex-shrink-0">{extIcon(att.filename)}</span>
                    <span className="text-xs font-ui text-foreground flex-1 truncate">{att.filename}</span>
                    <a href={att.url} download={att.filename} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 p-0.5 text-muted-foreground hover:text-[#b57e04] transition-colors" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <p className="text-xs text-muted-foreground font-ui">
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order details dialog (inhouse contracts) ─────────────────────────────────
import type { InhouseOrder } from "@/lib/api";

function OrderDetailsDialog({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: InhouseOrder;
}) {
  const style = (order.buyerInputs?.style as string) ?? null;
  const vision = (order.buyerInputs?.description as string) ?? order.description ?? null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display leading-snug pr-6">
            {order.service?.packageName ?? "Direct Order"}
          </DialogTitle>
          <DialogDescription className="sr-only">Order details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/30 text-xs font-ui">
              Direct Order
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
              <DollarSign className="w-3 h-3" /> ${(order.priceCents / 100).toFixed(2)} {order.currency.toUpperCase()}
            </span>
            {order.service?.deliveryDays && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
                <Clock className="w-3 h-3" /> {order.service.deliveryDays}-day delivery
              </span>
            )}
          </div>

          {/* Art style */}
          {style && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Style</p>
              <p className="text-foreground text-sm font-ui">{style}</p>
            </div>
          )}

          {/* Vision / description */}
          {vision && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Brief</p>
              <p className="text-foreground text-sm leading-relaxed font-ui">{vision}</p>
            </div>
          )}

          {/* Service description */}
          {order.service?.description && (
            <div className="bg-muted/50 rounded-xl p-3.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">Package</p>
              <p className="text-foreground text-sm leading-relaxed font-ui">{order.service.description}</p>
            </div>
          )}

          {/* Attachments */}
          {order.attachments.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 font-ui">
                Reference Files
              </p>
              <div className="space-y-1.5">
                {order.attachments.map((att) => (
                  <div key={att.key} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground flex-shrink-0">{extIcon(att.filename)}</span>
                    <span className="text-xs font-ui text-foreground flex-1 truncate">{att.filename}</span>
                    {att.url && (
                      <a
                        href={att.url}
                        download={att.filename}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 p-0.5 text-muted-foreground hover:text-[#b57e04] transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <p className="text-xs text-muted-foreground font-ui">
              Order ID: {order.id.slice(0, 8)}... · Placed {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
