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
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!data.session || error) {
        router.replace("/login");
        return;
      }

      // Extract token once — pass it directly to all API calls to avoid
      // calling getSession() again (re-acquiring the auth lock causes deadlocks).
      const token = data.session.access_token;

      let isNewUser = false;
      try {
        const result = await api.registerUser(token);
        isNewUser = result.isNew;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?error=" + encodeURIComponent("Your session could not be verified. Please sign in again."));
          return;
        }
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
        const me = await api.getMe(token);
        const roles = me.roles ?? [];
        if (roles.length === 0) {
          router.replace("/onboarding");
        } else if (roles.includes("AGENT_LISTER") && !roles.includes("BUYER")) {
          router.replace("/dashboard/agent");
        } else {
          router.replace("/dashboard/buyer");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?error=" + encodeURIComponent("Your session could not be verified. Please sign in again."));
          return;
        }
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
