"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { joinGroupByCode } from "./actions";

function InviteContent() {
  const code = useSearchParams().get("code");
  const router = useRouter();
  const [msg, setMsg] = useState("초대장 확인 중...");

  useEffect(() => {
    if (!code) return;
    
    // 로그인이 완료될 때까지 기다렸다가 실행
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        joinGroupByCode(code).then(res => {
          alert(res.message);
          router.push("/");
        });
      } else {
        setMsg("로그인이 필요합니다. 로그인 후 다시 접속해주세요.");
      }
    });
  }, [code, router]);

  return <div className="p-10 text-center">{msg}</div>;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><InviteContent /></Suspense>;
}
