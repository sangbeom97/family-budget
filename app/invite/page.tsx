"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [status, setStatus] = useState("초대장 확인 중...");

  useEffect(() => {
    const joinGroup = async () => {
      if (!code) {
        setStatus("잘못된 초대 링크");
        return;
      }

      console.log("CODE =", code);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("CLIENT USER", user);

      if (!user) {
        alert("로그인이 필요합니다.");

        const currentUrl = encodeURIComponent(window.location.href);

        router.push(`/login?redirect=${currentUrl}`);
        return;
      }

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id,name,invite_code")
        .eq("invite_code", code)
        .single();

      console.log("GROUP", group);
      console.log("GROUP ERROR", groupError);

      if (groupError || !group) {
        alert("잘못된 초대 코드입니다.");
        router.push("/");
        return;
      }

      const { error: insertError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (insertError) {
        console.log("INSERT ERROR", insertError);

        if (insertError.code === "23505") {
          alert("이미 가입된 그룹입니다.");
        } else {
          alert("가입 실패: " + insertError.message);
        }

        router.push("/");
        return;
      }

      alert(`${group.name} 그룹에 가입되었습니다.`);
      router.push("/");
    };

    joinGroup();
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">{status}</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}