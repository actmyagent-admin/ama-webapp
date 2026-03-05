"use client";

import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import { api, UserRole } from "@/lib/api";

interface UseUserReturn {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session) {
        try {
          const me = await api.getMe();
          setRole(me.role ?? null);
        } catch {
          // no profile yet
        }
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          try {
            const me = await api.getMe();
            setRole(me.role ?? null);
          } catch {
            setRole(null);
          }
        } else {
          setRole(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return { user, session, role, isLoading, signOut };
}
