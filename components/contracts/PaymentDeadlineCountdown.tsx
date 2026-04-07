"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/api";

interface PaymentDeadlineCountdownProps {
  deadline: string;
  amountTotal: number;
  currency: string;
  role: UserRole;
  onPayNow: () => void;
  onExpired: () => void;
}

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  const total = Math.floor(diff / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds, total };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PaymentDeadlineCountdown({
  deadline,
  amountTotal,
  currency,
  role,
  onPayNow,
  onExpired,
}: PaymentDeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(deadline);
      setTimeLeft(t);
      if (t.total === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100);

  const formattedDeadline = new Date(deadline).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Urgency level
  const urgent = timeLeft.hours <= 1;
  const warning = !urgent && timeLeft.hours <= 12;
  const expired = timeLeft.total === 0;

  if (role === "AGENT_LISTER") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-5 py-4 flex items-start gap-3 mb-5">
        <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-blue-800 dark:text-blue-200 font-semibold font-ui text-sm">
            Waiting for buyer payment
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-ui mt-0.5">
            The buyer has been notified and has{" "}
            <span className="font-medium">
              {timeLeft.hours}h {pad(timeLeft.minutes)}m
            </span>{" "}
            to complete payment. You&apos;ll receive a notification once the contract is active.
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-5 py-4 mb-5">
        <p className="text-red-700 dark:text-red-300 font-semibold font-ui text-sm">
          Payment window expired
        </p>
        <p className="text-red-600 dark:text-red-400 text-xs font-ui mt-1">
          Refreshing contract status…
        </p>
      </div>
    );
  }

  const bannerColors = urgent
    ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
    : warning
      ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      : "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30";

  const headingColors = urgent
    ? "text-red-700 dark:text-red-300"
    : warning
      ? "text-amber-700 dark:text-amber-300"
      : "text-indigo-700 dark:text-indigo-300";

  const bodyColors = urgent
    ? "text-red-600 dark:text-red-400"
    : warning
      ? "text-amber-600 dark:text-amber-400"
      : "text-indigo-600 dark:text-indigo-400";

  const digitBg = urgent
    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
    : warning
      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
      : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200";

  return (
    <div
      className={`rounded-xl border ${bannerColors} px-5 py-4 mb-5 ${urgent ? "animate-pulse" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-5 h-5 flex-shrink-0 ${headingColors}`} />
        <p className={`font-semibold font-ui text-sm ${headingColors}`}>
          Payment Required
        </p>
      </div>

      <p className={`text-sm font-ui mb-3 ${bodyColors}`}>
        Both parties have signed. Secure payment to activate this contract and notify your agent to
        begin work.
      </p>

      {/* Countdown */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-ui ${bodyColors}`}>Time remaining:</span>
        <div className="flex items-center gap-1">
          <span className={`font-mono font-bold text-lg rounded px-2 py-0.5 ${digitBg}`}>
            {pad(timeLeft.hours)}
          </span>
          <span className={`font-mono font-bold ${headingColors}`}>:</span>
          <span className={`font-mono font-bold text-lg rounded px-2 py-0.5 ${digitBg}`}>
            {pad(timeLeft.minutes)}
          </span>
          <span className={`font-mono font-bold ${headingColors}`}>:</span>
          <span className={`font-mono font-bold text-lg rounded px-2 py-0.5 ${digitBg}`}>
            {pad(timeLeft.seconds)}
          </span>
        </div>
      </div>

      <p className={`text-xs font-ui mb-3 ${bodyColors}`}>
        Amount:{" "}
        <span className="font-semibold">
          {formattedAmount} {currency.toUpperCase()}
        </span>{" "}
        (held in escrow until delivery)
      </p>

      <Button
        onClick={onPayNow}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-ui font-medium mb-3"
      >
        Pay Now — {formattedAmount}
      </Button>

      <div className={`flex items-start gap-1.5 text-xs font-ui ${bodyColors}`}>
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Contract will be voided if payment is not received by {formattedDeadline}.
        </span>
      </div>
    </div>
  );
}
