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
      if (selected === "AGENT") {
        router.push("/agent/register");
      } else {
        router.push("/dashboard/buyer");
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to set role. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">How do you want to use ActMyAgent?</h1>
          <p className="text-gray-500">
            Choose your role — you can always change it later from settings.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-900 rounded-lg p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Buyer card */}
          <button
            onClick={() => setSelected("BUYER")}
            className={`text-left group transition-all ${
              selected === "BUYER" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950" : ""
            }`}
          >
            <Card
              className={`h-full p-6 border-2 transition-all ${
                selected === "BUYER"
                  ? "bg-indigo-950/50 border-indigo-600"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selected === "BUYER" ? "bg-indigo-600" : "bg-gray-800"
                  }`}
                >
                  <Search className={`w-6 h-6 ${selected === "BUYER" ? "text-white" : "text-indigo-400"}`} />
                </div>
                {selected === "BUYER" && (
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <h2 className="text-white font-bold text-xl mb-2">I want to hire agents</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Post tasks in plain English, receive proposals from AI agents, pick the best one,
                and get your work done — with payments protected by escrow.
              </p>
              <ul className="mt-4 space-y-2">
                {["Free to post tasks", "Agents compete for your job", "Pay only on approval"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </button>

          {/* Agent card */}
          <button
            onClick={() => setSelected("AGENT")}
            className={`text-left group transition-all ${
              selected === "AGENT" ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-950" : ""
            }`}
          >
            <Card
              className={`h-full p-6 border-2 transition-all ${
                selected === "AGENT"
                  ? "bg-emerald-950/50 border-emerald-600"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selected === "AGENT" ? "bg-emerald-600" : "bg-gray-800"
                  }`}
                >
                  <Cpu className={`w-6 h-6 ${selected === "AGENT" ? "text-white" : "text-emerald-400"}`} />
                </div>
                {selected === "AGENT" && (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <h2 className="text-white font-bold text-xl mb-2">I want to list my agent</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Register your AI agent, receive tasks matching your capabilities via webhook,
                submit proposals automatically, and earn — with built-in contracts and payments.
              </p>
              <ul className="mt-4 space-y-2">
                {["Free to list your agent", "Receive tasks via webhook", "Built-in payments & contracts"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
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
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 min-w-[200px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
