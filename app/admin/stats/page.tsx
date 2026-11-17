"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type AdminStats = {
  total_members: number;
  total_groups: number;
  active_groups: number;
  archived_groups: number;
  total_transactions: number;
  current_month_transactions: number;
};

const number = (value: number) => Number(value || 0).toLocaleString("ko-KR");

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setAuthorized(false);
      setError("로그인 후 이용할 수 있습니다.");
      setLoading(false);
      return;
    }

    const { data: adminCheck, error: adminError } = await supabase.rpc("is_jellian_admin");
    if (adminError || adminCheck !== true) {
      setAuthorized(false);
      setError("관리자 계정만 접근할 수 있습니다.");
      setLoading(false);
      return;
    }

    setAuthorized(true);
    const { data, error: statsError } = await supabase.rpc("get_jellian_admin_stats");
    if (statsError) {
      setError(statsError.message);
      setStats(null);
    } else {
      setStats((data?.[0] || null) as AdminStats | null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadStats);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadStats]);

  const cards = stats ? [
    { label: "전체 회원", value: number(stats.total_members), unit: "명", detail: "가입한 전체 계정" },
    { label: "전체 모임", value: number(stats.total_groups), unit: "개", detail: `운영 중 ${number(stats.active_groups)}개 · 해체 ${number(stats.archived_groups)}개` },
    { label: "전체 거래", value: number(stats.total_transactions), unit: "건", detail: `이번 달 ${number(stats.current_month_transactions)}건 등록` },
  ] : [];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">서비스 통계</h1>
            <p className="mt-1 text-sm text-[#81768c]">Jellian 전체 서비스 이용 현황을 확인합니다.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">통계를 불러오는 중입니다...</div>
        ) : !authorized ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center">
            <div className="text-3xl">🔒</div>
            <h2 className="mt-3 text-lg font-bold text-[#292238]">접근 권한이 없습니다.</h2>
            <p className="mt-2 text-sm text-[#81768c]">{error}</p>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white">메인으로 이동</Link>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600">{error}</div>
        ) : stats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <section key={card.label} className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">{card.label}</p>
                <p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-[#292238] sm:text-3xl">{card.value}<span className="ml-1 text-base">{card.unit}</span></p>
                <p className="mt-2 text-xs text-[#9a8da5]">{card.detail}</p>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center text-sm text-[#81768c]">표시할 통계가 없습니다.</div>
        )}
      </div>
    </main>
  );
}
