"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대장 확인 중...");

  useEffect(() => {
    if (!code) {
      setStatus("초대 코드가 없습니다.");
      return;
    }

    const init = async () => {
      // 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const result = await joinGroupByCode(code);
        alert(result.message);
        router.push("/");
      } else {
        // 세션 없으면 로그인 화면으로 이동
        router.push("/");
      }
    };
    init();
  }, [code, router]);

  return <div className="p-10 text-center">{status}</div>;
}

export default function InvitePage() {
  return <Suspense fallback={<div>Loading...</div>}><InviteContent /></Suspense>;
}
