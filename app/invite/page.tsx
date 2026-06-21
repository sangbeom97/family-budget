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
    if (!code) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {

  console.log("CLIENT SESSION", session);

  if (session) {
      if (session) {
        joinGroupByCode(code).then(res => {
          alert(res.message);
          router.push("/");
        });
      } else {
        router.push("/");
      }
    });
  }, [code, router]);

  return <div className="p-10 text-center">{status}</div>;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><InviteContent /></Suspense>;
}
