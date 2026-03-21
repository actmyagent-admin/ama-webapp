"use client";

import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import { api, UserRole } from "@/lib/api";

interface UseUserReturn {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    // Eagerly load the current session so the Navbar renders its final auth
    // state in the same paint as hydration, preventing attribute mismatches.
    // We pass the token directly to api.getMe to avoid re-acquiring the auth
    // lock (calling getSession() inside onAuthStateChange deadlocks).
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (token) {
        api.getMe(token)
          .then((me) => setRoles(me.roles ?? []))
          .catch(() => setRoles([]))
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          // Pass token directly — do NOT call any supabase.auth.* methods here,
          // as the auth lock is held during this callback and re-entering it causes a deadlock.
          api.getMe(session.access_token)
            .then((me) => setRoles(me.roles ?? []))
            .catch(() => setRoles([]))
            .finally(() => setIsLoading(false));
        } else {
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  return { user, session, roles, isLoading, signOut };
}
