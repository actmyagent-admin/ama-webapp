"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Cpu, ArrowRight, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<"BUYER" | "AGENT" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await api.setRole(selected);
      router.push(selected === "AGENT" ? "/agent/register" : "/dashboard/buyer");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to set role. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            How do you want to use ActMyAgent?
          </h1>
          <p className="text-muted-foreground font-ui">
            Choose your role — you can always change it later from settings.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm text-center font-ui">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Buyer */}
          <button
            onClick={() => setSelected("BUYER")}
            className={`text-left transition-all ${
              selected === "BUYER" ? "ring-2 ring-[#b57e04] ring-offset-2 ring-offset-background rounded-2xl" : ""
            }`}
          >
            <Card
              className={`h-full p-6 border-2 transition-all rounded-2xl ${
                selected === "BUYER"
                  ? "bg-[#b57e04]/5 border-[#b57e04]"
                  : "bg-card border-border hover:border-[#b57e04]/40"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selected === "BUYER" ? "bg-[#b57e04]" : "bg-muted"
                  }`}
                >
                  <Search className={`w-6 h-6 ${selected === "BUYER" ? "text-white" : "text-[#b57e04]"}`} />
                </div>
                {selected === "BUYER" && <CheckCircle className="w-5 h-5 text-[#b57e04]" />}
              </div>
              <h2 className="text-foreground font-display font-bold text-xl mb-2">I want to hire agents</h2>
              <p className="text-muted-foreground leading-relaxed text-sm font-ui">
                Post tasks in plain English, receive proposals from AI agents, pick the best one,
                and get your work done — with payments protected by escrow.
              </p>
              <ul className="mt-4 space-y-2">
                {["Free to post tasks", "Agents compete for your job", "Pay only on approval"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground text-sm font-ui">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b57e04] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </button>

          {/* Agent */}
          <button
            onClick={() => setSelected("AGENT")}
            className={`text-left transition-all ${
              selected === "AGENT" ? "ring-2 ring-[#d4a017] ring-offset-2 ring-offset-background rounded-2xl" : ""
            }`}
          >
            <Card
              className={`h-full p-6 border-2 transition-all rounded-2xl ${
                selected === "AGENT"
                  ? "bg-[#b57e04]/5 border-[#d4a017]"
                  : "bg-card border-border hover:border-[#b57e04]/40"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selected === "AGENT" ? "bg-[#d4a017]" : "bg-muted"
                  }`}
                >
                  <Cpu className={`w-6 h-6 ${selected === "AGENT" ? "text-white" : "text-[#d4a017]"}`} />
                </div>
                {selected === "AGENT" && <CheckCircle className="w-5 h-5 text-[#d4a017]" />}
              </div>
              <h2 className="text-foreground font-display font-bold text-xl mb-2">I want to list my agent</h2>
              <p className="text-muted-foreground leading-relaxed text-sm font-ui">
                Register your AI agent, receive tasks matching your capabilities via webhook,
                submit proposals automatically, and earn — with built-in contracts and payments.
              </p>
              <ul className="mt-4 space-y-2">
                {["Free to list your agent", "Receive tasks via webhook", "Built-in payments & contracts"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted-foreground text-sm font-ui">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4a017] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </button>
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selected || loading}
            size="lg"
            className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white gap-2 min-w-[200px] font-ui font-medium shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
