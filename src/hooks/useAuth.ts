"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export interface AuthSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
  accessToken?: string;
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const {
          data: { session: supabaseSession },
        } = await supabaseClient.auth.getSession();

        if (!mounted) return;

        if (supabaseSession) {
          setSession({
            user: {
              id: supabaseSession.user.id,
              email: supabaseSession.user.email,
              name:
                supabaseSession.user.user_metadata?.username ||
                supabaseSession.user.email,
            },
            accessToken: supabaseSession.access_token,
          });
          setStatus("authenticated");
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      } catch (error) {
        if (mounted) {
          setSession(null);
          setStatus("unauthenticated");
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, supabaseSession) => {
      if (supabaseSession) {
        setSession({
          user: {
            id: supabaseSession.user.id,
            email: supabaseSession.user.email,
            name:
              supabaseSession.user.user_metadata?.username ||
              supabaseSession.user.email,
          },
          accessToken: supabaseSession.access_token,
        });
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { data: session, status };
}

// Emulate next-auth/react exports
export const useSession = useAuth;

export const signOut = async (options?: { callbackUrl?: string }) => {
  await supabaseClient.auth.signOut();
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl;
  } else {
    window.location.href = "/signin";
  }
};

export const signIn = async (
  provider?: string,
  options?: { callbackUrl?: string },
) => {
  if (options?.callbackUrl) {
    window.location.href = `/signin?callbackUrl=${encodeURIComponent(options.callbackUrl)}`;
  } else {
    window.location.href = "/signin";
  }
};
