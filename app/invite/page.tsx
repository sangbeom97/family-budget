"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 정보를 확인하고 있습니다...");

  useEffect(() => {
    if (!code) {
      setStatus("❌ 잘못된 초대 링크입니다.");
      return;
    }

    const handleJoin = async () => {
      // 1. 현재 세션 상태를 가져옵니다.
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 이미 로그인된 상태라면 바로 가입
        const result = await joinGroupByCode(code);
        alert(result.message);
        router.push("/");
      } else {
        // 2. 로그인 안된 상태라면 세션이 들어오길 기다립니다.
        setStatus("로그인을 확인하고 있습니다...");
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe(); // 감지기 해제
            const result = await joinGroupByCode(code);
            alert(result.message);
            router.push("/");
          }
        });
      }
    };

    handleJoin();
  }, [code, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-white p-6 rounded-2xl shadow-sm border w-full max-w-sm">
        <h2 className="text-xl font-black mb-2">📊 가계부 방 가입 중</h2>
        <p className="text-slate-600 animate-pulse">{status}</p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return <Suspense fallback={<div>불러오는 중...</div>}><InviteContent /></Suspense>;
}
