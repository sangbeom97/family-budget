"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // 🎯 안전한 클라이언트 전용 라이브러리 사용
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");
  
  // 클라이언트 컴포넌트 전용 Supabase 인스턴스 생성
  const supabase = createClientComponentClient();

  useEffect(() => {
    // 1. 주소창에 초대 코드가 없는 경우 예외 처리
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    // 2. 가입 프로세스 실행 함수 (확실하게 string 타입만 인자로 받음)
    async function processJoin(validCode: string) {
      const result = await joinGroupByCode(validCode);

      if (result.success) {
        alert(result.message);
        router.push("/"); // 가입 성공 시 메인/대시보드로 이동
      } else {
        if (result.needLogin) {
          alert("가계부 방에 참여하려면 먼저 구글 로그인이 필요합니다! 로그인 화면으로 이동합니다.");
          router.push("/"); 
        } else {
          setStatus(`❌ 오류: ${result.message}`);
        }
      }
    }

    // 3. 로그인 세션 상태를 완벽하게 보장한 뒤 가입 실행
    const checkAuthAndJoin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 이미 세션이 안전하게 박혀있다면 바로 가입 진행
        processJoin(code);
      } else {
        // 구글 로그인 직후 세션 쿠키가 뒤늦게 정착하는 타이밍을 실시간으로 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (currentSession) {
            processJoin(code);
            subscription.unsubscribe(); // 감지 완료 후 리스너 제거
          } else {
            // 세션 체크가 끝났는데도 비로그인 상태라면 메인으로 리다이렉트
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
