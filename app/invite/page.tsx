"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");

  useEffect(() => {
    // 1. code가 null인 경우 먼저 완벽히 필터링 (이전 타입 에러 해결)
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    async function processJoin() {
      const result = await joinGroupByCode(code);

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

    processJoin();
  }, [code, router]);

  return (
    <div className="text-center p-6 bg-white dark:bg-slate-950 rounded-2xl shadow-md border max-w-sm w-full">
      <h2 className="text-2xl font-black mb-2">📊 무계획 속 계획</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium animate-pulse">{status}</p>
    </div>
  );
}

// 🎯 가장 중요: Next.js 페이지 파일은 반드시 'export default'가 붙은 컴포넌트가 있어야 합니다.
export default function InvitePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={<div>초대 정보를 불러오는 중...</div>}>
        <InviteContent />
      </Suspense>
    </main>
  );
}
