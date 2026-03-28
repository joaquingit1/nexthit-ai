"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export function useAuth(redirectTo: string = "/login") {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user && redirectTo) {
        router.push(redirectTo);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && redirectTo) {
        router.push(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [redirectTo, router]);

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  return { user, loading, signOut };
}
