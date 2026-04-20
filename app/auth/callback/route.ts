import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );
  }

  // Thread the ?redirect param through so onboarding-check knows where to send
  // the user after registration/role setup is complete.
  const redirectParam = searchParams.get("redirect");
  const onboardingDest = redirectParam
    ? `/onboarding-check?redirect=${encodeURIComponent(redirectParam)}`
    : "/onboarding-check";

  // Create the redirect response first so cookie handlers can write directly
  // onto it. On Cloudflare Workers edge runtime, cookies() from next/headers
  // does NOT automatically merge into a separately-created NextResponse, so the
  // Set-Cookie headers would be lost and the session would never reach the
  // browser.
  const response = NextResponse.redirect(new URL(onboardingDest, request.url));

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
