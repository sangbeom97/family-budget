"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 기존 설정 파일 사용
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인 중입니다...");

  useEffect(() => {
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    const processJoin = async () => {
      // 1. 현재 세션 상태 확인
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 이미 로그인이 되어 있다면 바로 가입 실행
        const result = await joinGroupByCode(code);
        alert(result.message);
        router.push("/");
      } else {
        // 2. 로그인이 안 되어 있다면 로그인 시도 (또는 리다이렉트)
        // 만약 로그인 버튼이 있는 페이지로 보내야 한다면 아래 주석 해제
        // alert("가입을 위해 로그인이 필요합니다.");
        // router.push("/login"); 
        
        // 혹은 자동으로 로그인 페이지로 보내지 않고 상태만 표시
        setStatus("가입을 위해 먼저 로그인을 완료해주세요.");
      }
    };

    processJoin();
  }, [code, router]);

  return (
    <div className="text-center p-6 bg-white border rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-2">무계획 속 계획</h2>
      <p>{status}</p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <InviteContent />
    </Suspense>
  );
}
