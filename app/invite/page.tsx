"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 기존 설정 파일 사용
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");

  useEffect(() => {
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    const processJoin = async () => {
      // 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const result = await joinGroupByCode(code);
        if (result.success) {
          alert(result.message);
          router.push("/");
        } else if (result.needLogin) {
          alert("로그인이 필요합니다.");
          router.push("/");
        } else {
          setStatus(result.message);
        }
      } else {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        router.push("/");
      }
    };

    processJoin();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white border rounded-xl">{status}</div>
    </div>
  );
}

export default function InvitePage() {
  return <Suspense fallback={<div>로딩 중...</div>}><InviteContent /></Suspense>;
}
