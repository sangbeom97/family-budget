"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) window.location.replace("/");
    });
    return () => { active = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const pendingInvite = localStorage.getItem("pendingInvite");
    const redirectUrl = pendingInvite || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) {
      alert(`구글 로그인 실패: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#fffaff] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#f0e8f5] bg-white p-8 text-center shadow-xl shadow-[#a56bc0]/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8528e8] to-[#f04e9a] text-3xl text-white">💜</div>
        <h1 className="mt-5 text-2xl font-black text-[#292238]">Jellian 시작하기</h1>
        <p className="mt-3 text-sm leading-7 text-[#81768c]">구글 계정으로 로그인하고 우리 둘의 가계부를 함께 관리해 보세요.</p>
        <button onClick={handleGoogleSignIn} disabled={loading} className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-[#eee6f3] bg-white px-4 py-3 text-sm font-bold text-[#292238] transition hover:bg-[#fcf7ff] disabled:cursor-wait disabled:opacity-60">
          <span className="text-lg font-black">G</span>
          {loading ? "구글 로그인으로 이동 중..." : "구글 계정으로 시작하기"}
        </button>
        <Link href="/intro" className="mt-6 inline-block text-sm font-semibold text-[#984bd0] hover:underline">서비스 소개로 돌아가기</Link>
      </div>
    </main>
  );
}
