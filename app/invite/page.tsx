"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // 🎯 Supabase 클라이언트 추가
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");
  
  // Supabase 클라이언트 초기화
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    // 그룹 가입 처리 핵심 로직
    async function processJoin(validCode: string) {
      const result = await joinGroupByCode(validCode);

      if (result.success) {
        alert(result.message);
        router.push("/"); 
      } else {
        if (result.needLogin) {
          alert("가계부 방에 참여하려면 먼저 구글 로그인이 필요합니다! 로그인 화면으로 이동합니다.");
          router.push("/"); 
        } else {
          setStatus(`❌ 오류: ${result.message}`);
        }
      }
    }

    // 🎯 [핵심] 현재 Supabase 로그인 세션이 완전히 로드될 때까지 대기 및 감지
    const checkAuthAndJoin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 이미 세션이 있다면 즉시 가입 진행
        processJoin(code);
      } else {
        // 혹시 세션이 늦게 들어오는 중일 수 있으므로, 상태 변화를 한 번 더 감지합니다.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            processJoin(code);
            subscription.unsubscribe(); // 감지기 해제
          } else {
            // 세션 검사 끝내고 완전히 로그아웃 상태라면 로그인 화면으로 유도
            alert("가계부 방에 참여하려면 먼저 구글 로그인이 필요합니다! 로그인 화면으로 이동합니다.");
            router.push("/");
          }
        });
      }
    };

    checkAuthAndJoin();
  }, [code, router, supabase]);

  return (
    <div className="text-center p-6 bg-white dark:bg-slate-950 rounded-2xl shadow-md border max-w-sm w-full">
      <h2 className="text-2xl font-black mb-2">📊 무계획 속 계획</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium animate-pulse">{status}</p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={<div>초대 정보를 불러오는 중...</div>}>
        <InviteContent />
      </Suspense>
    </main>
  );
}
