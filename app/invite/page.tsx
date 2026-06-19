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
    // 1. code가 없거나 null이면 여기서 즉시 중단
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    async function processJoin(validCode: string) {
      // 🎯 매개변수로 확실한 string(validCode)만 받아서 서버 액션에 넘깁니다.
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

    // 🎯 2. 위에서 null 검사를 마쳤으므로 code가 존재할 때만 실행합니다.
    processJoin(code);
  }, [code, router]);

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
