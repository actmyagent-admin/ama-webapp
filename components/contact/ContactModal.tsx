"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { ContactFormContent } from "./ContactFormContent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      // Reset submitted state after close animation finishes
      setTimeout(() => setSubmitted(false), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-[#b57e04]/10">
              <MessageSquare className="w-4 h-4 text-[#b57e04]" />
            </div>
            <DialogTitle className="font-display text-xl">
              Contact Us
            </DialogTitle>
          </div>
          <DialogDescription className="font-ui text-sm">
            Have a question or want to get in touch? Fill in the form below and we&apos;ll respond as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {/* Gold divider */}
        <div className="h-[1px] bg-gradient-to-r from-[#b57e04]/40 via-[#d4a017]/30 to-transparent mb-4" />

        <ContactFormContent onSuccess={() => setSubmitted(true)} />

        {/* Suppress unused var warning */}
        {submitted && null}
      </DialogContent>
    </Dialog>
  );
}
