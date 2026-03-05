"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, Delivery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  CheckCircle,
  XCircle,
  FileDown,
  Loader2,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBrowserClient } from "@/lib/supabase";

interface DeliveryPanelProps {
  contractId: string;
  isAgent: boolean;
  delivery?: Delivery;
  escrowPaid: boolean;
}

export function DeliveryPanel({ contractId, isAgent, delivery, escrowPaid }: DeliveryPanelProps) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmitDelivery = async () => {
    if (!description.trim()) return;
    setUploading(true);
    try {
      let fileUrls: string[] = [];

      if (files.length > 0) {
        const supabase = getBrowserClient();
        fileUrls = await Promise.all(
          files.map(async (file) => {
            const path = `deliveries/${contractId}/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage
              .from("deliveries")
              .upload(path, file);
            if (error) throw error;
            const { data } = supabase.storage.from("deliveries").getPublicUrl(path);
            return data.publicUrl;
          })
        );
      }

      await api.submitDelivery({ contractId, description, fileUrls });
      toast({ title: "Delivery submitted!", description: "The buyer has been notified." });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to submit delivery",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async () => {
    if (!delivery) return;
    setApproving(true);
    try {
      await api.approveDelivery(delivery.id);
      toast({
        title: "Payment released!",
        description: "The funds have been released to the agent.",
      });
      setApproveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to approve delivery",
        variant: "destructive",
      });
      setApproving(false);
    }
  };

  const handleDispute = async () => {
    if (!delivery) return;
    try {
      await api.disputeDelivery(delivery.id);
      toast({
        title: "Dispute filed",
        description: "Our team will review and contact both parties.",
      });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message ?? "Failed to file dispute",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Delivery</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!delivery ? (
          isAgent ? (
            /* Agent: upload delivery */
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">
                Complete the work and submit your delivery below.
              </p>
              <div>
                <Label className="text-gray-400 text-sm mb-2 block">Delivery Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you've delivered and any important notes..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none min-h-[120px]"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-sm mb-2 block">
                  Attach Files (optional)
                </Label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-xl p-6 cursor-pointer hover:border-gray-600 transition-colors">
                  <Upload className="w-6 h-6 text-gray-600" />
                  <span className="text-gray-500 text-sm">
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : "Click to upload files"}
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              </div>
              <Button
                onClick={handleSubmitDelivery}
                disabled={!description.trim() || uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                Submit Delivery
              </Button>
            </div>
          ) : (
            /* Buyer: waiting */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">Waiting for delivery from the agent...</p>
            </div>
          )
        ) : (
          /* Delivery exists */
          <div className="space-y-4">
            <div className={`rounded-xl p-4 border ${
              delivery.status === "APPROVED"
                ? "bg-emerald-950/30 border-emerald-900"
                : delivery.status === "DISPUTED"
                ? "bg-red-950/30 border-red-900"
                : "bg-gray-800/50 border-gray-700"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {delivery.status === "APPROVED" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : delivery.status === "DISPUTED" ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Package className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  delivery.status === "APPROVED"
                    ? "text-emerald-300"
                    : delivery.status === "DISPUTED"
                    ? "text-red-300"
                    : "text-gray-300"
                }`}>
                  {delivery.status === "APPROVED"
                    ? "Delivery Approved — Payment Released"
                    : delivery.status === "DISPUTED"
                    ? "Delivery Disputed"
                    : "Delivery Submitted"}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{delivery.description}</p>
            </div>

            {delivery.fileUrls && delivery.fileUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Files</p>
                {delivery.fileUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-indigo-400" />
                    File {i + 1}
                  </a>
                ))}
              </div>
            )}

            {!isAgent && delivery.status === "SUBMITTED" && escrowPaid && (
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => setApproveOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Release Payment
                </Button>
                <Button
                  onClick={handleDispute}
                  variant="outline"
                  className="w-full border-red-900 text-red-400 hover:bg-red-950/30 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Dispute
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Approve & Release Payment?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This will release the escrowed funds to the agent. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {approving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
