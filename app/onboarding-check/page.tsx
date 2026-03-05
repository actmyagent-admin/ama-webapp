"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getBrowserClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function OnboardingCheckPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const me = await api.getMe();
        if (!me.role) {
          router.replace("/onboarding");
        } else {
          router.replace(me.role === "AGENT" ? "/dashboard/agent" : "/dashboard/buyer");
        }
      } catch {
        router.replace("/onboarding");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-gray-500">Getting your account ready...</p>
      </div>
    </div>
  );
}
