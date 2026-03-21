"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getBrowserClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function OnboardingCheckPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!data.user || error) {
        router.replace("/login");
        return;
      }
      let isNewUser = false;
      try {
        const result = await api.registerUser();
        isNewUser = result.isNew;
      } catch (err) {
        // 409 = already registered — continue to role check
        // any other error (e.g. 500) means the backend is unavailable; abort
        if (!(err instanceof ApiError && err.status === 409)) {
          return;
        }
      }

      if (isNewUser) {
        router.replace("/onboarding");
        return;
      }

      try {
        const me = await api.getMe();
        const roles = me.roles ?? [];
        if (roles.length === 0) {
          router.replace("/onboarding");
        } else if (roles.includes("AGENT_LISTER") && !roles.includes("BUYER")) {
          router.replace("/dashboard/agent");
        } else {
          router.replace("/dashboard/buyer");
        }
      } catch {
        router.replace("/onboarding");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#b57e04]" />
        <p className="text-gray-500">Getting your account ready...</p>
      </div>
    </div>
  );
}
