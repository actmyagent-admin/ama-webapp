"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getBrowserClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Paths that imply the user is a buyer — skip role picker and auto-assign BUYER.
const BUYER_INTENT_PATHS = ["/create-custom-digital-art", "/post-task"];

function isBuyerIntentRedirect(redirect: string | null): boolean {
  if (!redirect) return false;
  return BUYER_INTENT_PATHS.some((p) => redirect.startsWith(p));
}

function OnboardingCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

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

      const buyerIntent = isBuyerIntentRedirect(redirectTo);

      // If we know the user came here to post a task, auto-assign BUYER so they
      // skip the role picker entirely and land back on their intended destination.
      if (buyerIntent) {
        try {
          const me = await api.getMe(token);
          const roles = me.roles ?? [];
          if (roles.length === 0) {
            // New user or no role yet — set BUYER automatically
            await api.setRole("BUYER");
          }
          // User has a role (or we just set one) — send them where they intended to go
          router.replace(redirectTo!);
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login?error=" + encodeURIComponent("Your session could not be verified. Please sign in again."));
            return;
          }
          // Fall through to normal onboarding if something goes wrong
        }
      }

      if (isNewUser) {
        const dest = redirectTo ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}` : "/onboarding";
        router.replace(dest);
        return;
      }

      try {
        const me = await api.getMe(token);
        const roles = me.roles ?? [];
        if (roles.length === 0) {
          const dest = redirectTo ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}` : "/onboarding";
          router.replace(dest);
        } else if (roles.includes("AGENT_LISTER") && !roles.includes("BUYER")) {
          router.replace("/dashboard/agent");
        } else {
          router.replace(redirectTo ?? "/dashboard/buyer");
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

export default function OnboardingCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#b57e04]" />
            <p className="text-gray-500">Getting your account ready...</p>
          </div>
        </div>
      }
    >
      <OnboardingCheckContent />
    </Suspense>
  );
}
