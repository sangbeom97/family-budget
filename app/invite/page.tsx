"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { joinGroupByCode } from "./actions";

// 컴포넌트를 분리하여 타입 안정성을 확보합니다.
function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. searchParams에서 code를 안전하게 가져옵니다.
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");

  useEffect(() => {
    // 2. code가 null인 경우를 명확히 처리합니다.
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    async function processJoin() {
      // 3. code가 string임을 TypeScript가 인지하도록 보장합니다.
      const result = await joinGroupByCode(code as string);

      if (result.success) {
        alert(result.message);
        router.push("/");
      } else {
        if (result.needLogin) {
          alert("로그인이 필요합니다.");
          router.push("/");
        } else {
          setStatus(`❌ 오류: ${result.message}`);
        }
      }
    }

    processJoin();
  }, [code, router]);

  return (
    <div className="text-center p-6 bg-white rounded-2xl shadow-md border">
      <h2 className="text-2xl font-black mb-2">📊 무계획 속 계획</h2>
      <p className="text-sm font-medium animate-pulse">{status}</p>
    </div>
  );
}

// 4. 페이지 파일은 반드시 export default로 내보내야 합니다.
export default function InvitePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>초대 정보를 불러오는 중...</div>}>
        <InviteContent />
      </Suspense>
    </main>
  );
}
