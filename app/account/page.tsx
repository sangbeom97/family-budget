"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setEmail(data.session.user.email || "");
      setLoading(false);
    });
  }, [router]);

  const withdrawAccount = async () => {
    if (confirmation !== "탈퇴") return;
    if (!window.confirm("정말 회원 탈퇴를 진행할까요? 개인 정보와 개인 데이터는 삭제되며 되돌릴 수 없습니다.")) return;

    setSubmitting(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");

      const response = await fetch("/api/account/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "회원 탈퇴에 실패했습니다.");

      await supabase.auth.signOut();
      localStorage.removeItem("currentGroupId");
      router.replace("/");
      router.refresh();
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : "회원 탈퇴에 실패했습니다.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-[#81768c]">계정 정보를 확인하고 있습니다...</main>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-[#9145c9] hover:underline">← 메인으로</Link>
        <section className="mt-5 rounded-2xl border border-[#eee8f2] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#9874ad]">JELLIAN ACCOUNT</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#292238]">계정 관리</h1>
          <p className="mt-2 text-sm text-[#81768c]">로그인 계정: {email || "이메일 정보 없음"}</p>

          <div className="mt-8 rounded-xl border border-red-100 bg-red-50/60 p-5">
            <h2 className="font-extrabold text-red-700">회원 탈퇴</h2>
            <p className="mt-2 text-sm leading-6 text-[#665675]">
              탈퇴하면 로그인 계정과 프로필, 개인 문의 내역 및 개인 데이터가 삭제됩니다.
              다른 구성원과 함께 사용하는 그룹은 유지되며, 작성자 정보는 익명 처리됩니다.
              그룹장이 탈퇴하면 다른 활성 구성원에게 그룹장이 이전됩니다.
              남은 활성 구성원이 없는 그룹은 그룹과 관련 데이터가 함께 삭제됩니다.
            </p>
            <p className="mt-3 text-xs leading-5 text-red-700">
              탈퇴는 되돌릴 수 없습니다. 진행 중 오류가 발생하면 계정 접근은 차단된 상태일 수 있으니 고객지원으로 문의해 주세요.
            </p>

            <label htmlFor="withdraw-confirm" className="mt-5 block text-sm font-bold text-[#292238]">
              계속하려면 아래에 ‘탈퇴’를 입력해 주세요.
            </label>
            <input
              id="withdraw-confirm"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="탈퇴 입력"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-red-300"
              disabled={submitting}
            />

            {error && <p className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}

            <button
              type="button"
              onClick={withdrawAccount}
              disabled={confirmation !== "탈퇴" || submitting}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "탈퇴 처리 중..." : "회원 탈퇴"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
