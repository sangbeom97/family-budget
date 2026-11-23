"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
      } catch (error) {
        console.error("로그인 세션 확인 실패:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const pendingInvite = localStorage.getItem("pendingInvite");
      const redirectUrl = pendingInvite || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        alert(`구글 로그인 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("구글 로그인 요청 실패:", error);
      alert("구글 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return { session, authLoading, handleGoogleSignIn };
}
