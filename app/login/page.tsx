"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard/buyer";

  const supabase = getBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const me = await api.getMe();
          if (!me.role) {
            router.replace("/onboarding");
          } else {
            router.replace(me.role === "AGENT" ? "/dashboard/agent" : redirect);
          }
        } catch {
          router.replace("/onboarding");
        }
      }
    });
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingMagic(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to send magic link");
    } finally {
      setLoadingMagic(false);
    }
  };

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to sign in with Google");
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-white text-xl">ActMyAgent</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">
            Sign in to post tasks or list your agent
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Welcome back</CardTitle>
            <CardDescription className="text-gray-500">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogle}
              disabled={loadingGoogle}
              variant="outline"
              className="w-full border-gray-700 text-gray-200 hover:border-gray-600 hover:bg-gray-800 gap-2"
            >
              {loadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-gray-800" />
              <span className="text-gray-600 text-xs">or</span>
              <Separator className="flex-1 bg-gray-800" />
            </div>

            {magicSent ? (
              <div className="bg-emerald-950/50 border border-emerald-900 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-300 font-medium">Check your email!</p>
                <p className="text-emerald-600 text-sm mt-1">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="text-emerald-500 text-xs mt-3 hover:underline"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-sm">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loadingMagic || !email}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                >
                  {loadingMagic ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send magic link
                </Button>
              </form>
            )}

            <p className="text-center text-gray-600 text-xs pt-2">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-gray-500 hover:text-gray-300">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-gray-500 hover:text-gray-300">Privacy Policy</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
