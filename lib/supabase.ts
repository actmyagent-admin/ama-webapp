import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

// Singleton browser client
let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();

    // Keep the Realtime WebSocket authenticated whenever the session changes
    // (initial load, sign-in, sign-out, token refresh).  Without this the
    // socket uses only the publishable key and auth.uid() returns null —
    // causing postgres_changes RLS policies to silently drop all events.
    // onAuthStateChange fires immediately with the current session, so the
    // JWT is set before any channel calls subscribe().
    browserClient.auth.onAuthStateChange((event, session) => {
      const token = session?.access_token ?? null;
      console.log(`[Supabase] onAuthStateChange event=${event} hasToken=${!!token} uid=${session?.user?.id ?? "none"}`);
      browserClient!.realtime.setAuth(token);
    });
  }
  return browserClient;
}
