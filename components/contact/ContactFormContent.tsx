"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";

const SUBJECTS = [
  { value: "General Inquiry",         label: "General Inquiry" },
  { value: "Pricing & Plans",         label: "Pricing & Plans" },
  { value: "Agent Support",           label: "Agent Support" },
  { value: "Technical Issue",         label: "Technical Issue" },
  { value: "Billing & Payments",      label: "Billing & Payments" },
  { value: "Partnership Opportunity", label: "Partnership Opportunity" },
  { value: "__other__",               label: "Other" },
];

const LIMITS = { name: 50, email: 100, phone: 20, message: 300 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Props {
  onSuccess?: () => void;
}

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

export function ContactFormContent({ onSuccess }: Props) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");

  const [touched,  setTouched]  = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [status,   setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isOther = subject === "__other__";
  const resolvedSubject = isOther ? customSubject.trim() : subject;

  // ── Per-field validation ────────────────────────────────────────
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim())
      errs.name = "Name is required.";
    else if (name.length > LIMITS.name)
      errs.name = `Name must be ${LIMITS.name} characters or fewer.`;

    if (!email.trim())
      errs.email = "Email is required.";
    else if (email.length > LIMITS.email)
      errs.email = `Email must be ${LIMITS.email} characters or fewer.`;
    else if (!EMAIL_RE.test(email.trim()))
      errs.email = "Enter a valid email address (e.g. john@example.com).";

    if (phone.trim() && phone.length > LIMITS.phone)
      errs.phone = `Phone must be ${LIMITS.phone} characters or fewer.`;

    if (!message.trim())
      errs.message = "Message is required.";
    else if (message.length > LIMITS.message)
      errs.message = `Message must be ${LIMITS.message} characters or fewer.`;

    return errs;
  };

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;

  const touch = (field: keyof FieldErrors) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const fieldClass = (field: keyof FieldErrors) =>
    `font-ui bg-background border-border focus:border-[#b57e04] focus:ring-[#b57e04]/20 transition-colors ${
      touched[field] && errors[field]
        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
        : ""
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched so errors show
    setTouched({ name: true, email: true, phone: true, message: true });
    if (hasErrors || !resolvedSubject) return;

    setStatus("loading");
    setErrorMsg("");

    const payload: Record<string, string> = {
      name:    name.trim(),
      email:   email.trim(),
      subject: resolvedSubject,
      message: message.trim(),
      source:  "landing-page",
    };
    if (phone.trim()) payload.phone = phone.trim();

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201 || res.ok) {
        setStatus("success");
        onSuccess?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(
          (data as { message?: string }).message ||
          "Something went wrong. Please try again."
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("Unable to send message. Check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#b57e04]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#b57e04]" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground mb-1">
            Message sent!
          </h3>
          <p className="text-muted-foreground font-ui text-sm max-w-xs">
            Thanks for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact-name" className="font-ui text-sm font-medium">
              Name <span className="text-[#b57e04]">*</span>
            </Label>
            <span className={`text-xs font-ui tabular-nums ${name.length > LIMITS.name ? "text-destructive" : "text-muted-foreground"}`}>
              {name.length}/{LIMITS.name}
            </span>
          </div>
          <Input
            id="contact-name"
            value={name}
            maxLength={LIMITS.name + 1}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => touch("name")}
            placeholder="John Smith"
            className={fieldClass("name")}
          />
          {touched.name && errors.name && (
            <p className="text-destructive text-xs font-ui flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact-email" className="font-ui text-sm font-medium">
              Email <span className="text-[#b57e04]">*</span>
            </Label>
            <span className={`text-xs font-ui tabular-nums ${email.length > LIMITS.email ? "text-destructive" : "text-muted-foreground"}`}>
              {email.length}/{LIMITS.email}
            </span>
          </div>
          <Input
            id="contact-email"
            type="email"
            value={email}
            maxLength={LIMITS.email + 1}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            placeholder="john@example.com"
            className={fieldClass("email")}
          />
          {touched.email && errors.email && (
            <p className="text-destructive text-xs font-ui flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="contact-phone" className="font-ui text-sm font-medium">
            Phone{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <span className={`text-xs font-ui tabular-nums ${phone.length > LIMITS.phone ? "text-destructive" : "text-muted-foreground"}`}>
            {phone.length}/{LIMITS.phone}
          </span>
        </div>
        <Input
          id="contact-phone"
          type="tel"
          value={phone}
          maxLength={LIMITS.phone + 1}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => touch("phone")}
          placeholder="+1-555-0123"
          className={fieldClass("phone")}
        />
        {touched.phone && errors.phone && (
          <p className="text-destructive text-xs font-ui flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />{errors.phone}
          </p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label className="font-ui text-sm font-medium">
          Subject <span className="text-[#b57e04]">*</span>
        </Label>
        {isOther ? (
          <div className="flex gap-2">
            <Input
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Describe your subject…"
              autoFocus
              className="font-ui bg-background border-border focus:border-[#b57e04] focus:ring-[#b57e04]/20 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setSubject(""); setCustomSubject(""); }}
              className="border-border text-muted-foreground hover:border-[#b57e04] hover:text-[#b57e04] whitespace-nowrap font-ui"
            >
              Back
            </Button>
          </div>
        ) : (
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="font-ui bg-background border-border focus:border-[#b57e04] focus:ring-[#b57e04]/20 data-[state=open]:border-[#b57e04]">
              <SelectValue placeholder="Select a subject…" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="font-ui">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="contact-message" className="font-ui text-sm font-medium">
            Message <span className="text-[#b57e04]">*</span>
          </Label>
          <span className={`text-xs font-ui tabular-nums ${message.length > LIMITS.message ? "text-destructive" : "text-muted-foreground"}`}>
            {message.length}/{LIMITS.message}
          </span>
        </div>
        <Textarea
          id="contact-message"
          value={message}
          maxLength={LIMITS.message + 1}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={() => touch("message")}
          placeholder="Tell us how we can help…"
          rows={5}
          className={`${fieldClass("message")} resize-none`}
        />
        {touched.message && errors.message && (
          <p className="text-destructive text-xs font-ui flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />{errors.message}
          </p>
        )}
      </div>

      {/* API-level error */}
      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm font-ui">{errorMsg}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 font-ui font-medium shadow-md transition-all duration-200 hover:shadow-[0_4px_20px_rgba(181,126,4,0.3)] disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
