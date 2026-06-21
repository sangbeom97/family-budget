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
    async function processInvite() {
      if (!code) return;

      const { data: { session } } =
        await supabase.auth.getSession();

      console.log("CLIENT SESSION", session);

      // 추가
      const { data: { user } } =
        await supabase.auth.getUser();

      console.log("CLIENT USER", user);

      // 추가
      const { data: group, error } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", code);

      console.log("GROUP", group);
      console.log("GROUP ERROR", error);

      if (!session) {
        alert("세션 없음");
        router.push("/");
        return;
      }

      const res = await joinGroupByCode(code);

      alert(res.message);
      router.push("/");
    }

    processInvite();
  }, [code, router]);

  return <div className="p-10 text-center">{status}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}
