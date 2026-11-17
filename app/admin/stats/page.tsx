"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AdminStats = {
  total_members: number;
  total_groups: number;
  active_groups: number;
  archived_groups: number;
  total_transactions: number;
  current_month_transactions: number;
  total_group_owners: number;
  free_group_owners: number;
  premium_group_owners: number;
  premium_owned_groups: number;
  estimated_monthly_revenue: number;
};

type RevenueTrend = {
  month_label: string;
  snapshot_date: string;
  premium_group_owners: number;
  estimated_monthly_revenue: number;
};

const number = (value: number) => Number(value || 0).toLocaleString("ko-KR");
const won = (value: number) => `${number(value)}원`;

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [trendError, setTrendError] = useState("");

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
      const { data: trendData, error: revenueError } = await supabase.rpc("get_jellian_admin_revenue_trend");
      if (revenueError) {
        setTrendError(revenueError.message);
        setRevenueTrend([]);
      } else {
        setTrendError("");
        setRevenueTrend((trendData || []) as RevenueTrend[]);
      }
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
    { label: "운영 중인 모임", value: number(stats.active_groups), unit: "개", detail: `전체 ${number(stats.total_groups)}개 · 해체 ${number(stats.archived_groups)}개` },
    { label: "무료 모임장", value: number(stats.free_group_owners), unit: "명", detail: "운영 중인 모임을 1개 소유" },
    { label: "프리미엄 대상 모임장", value: number(stats.premium_group_owners), unit: "명", detail: "운영 중인 모임을 2개 이상 소유" },
    { label: "프리미엄 대상 모임", value: number(stats.premium_owned_groups), unit: "개", detail: "프리미엄 대상 모임장이 소유한 전체 모임" },
    { label: "월 예상 이용료", value: won(stats.estimated_monthly_revenue), unit: "", detail: `프리미엄 대상 ${number(stats.premium_group_owners)}명 × 월 2,900원` },
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
            <p className="mt-1 text-sm text-[#81768c]">모임장 기준 요금 정책과 서비스 이용 현황을 확인합니다.</p>
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
          <>
            <section className="mb-5 rounded-2xl border border-[#e8dff0] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-[#292238]">현재 이용료 정책</p>
                  <p className="mt-1 text-sm text-[#665675]">모임장 소유의 운영 중인 모임 1개 무료 · 2개 이상이면 월 2,900원 고정</p>
                </div>
                <span className="rounded-full bg-[#f4edf8] px-3 py-1.5 text-sm font-bold text-[#80509c]">월 2,900원</span>
              </div>
              <p className="mt-3 text-xs text-[#9a8da5]">결제 시스템 연동 전이므로 아래 이용료는 실제 결제 매출이 아닌 예상 금액입니다. 모임원으로 참여하는 모임은 과금 집계에서 제외합니다.</p>
            </section>

            <section className="mb-5 rounded-2xl border border-[#eee8f2] bg-white p-5">
              <div className="mb-4">
                <h2 className="text-base font-extrabold text-[#292238]">월별 예상 이용료 추이</h2>
                <p className="mt-1 text-xs text-[#9a8da5]">최근 12개월 · 각 월의 마지막 통계 조회 시점 기준 · 실제 결제 매출 아님</p>
              </div>
              {trendError ? (
                <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">추이 데이터를 불러오지 못했습니다: {trendError}</p>
              ) : revenueTrend.length === 0 ? (
                <p className="rounded-xl bg-[#faf8fc] p-8 text-center text-sm text-[#81768c]">첫 통계 기록을 준비하고 있습니다.</p>
              ) : (
                <>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrend} margin={{ top: 12, right: 12, left: 8, bottom: 4 }}>
                        <CartesianGrid stroke="#eee8f2" strokeDasharray="3 3" />
                        <XAxis dataKey="month_label" tick={{ fill: "#81768c", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#81768c", fontSize: 11 }} tickFormatter={(value) => String(Math.round(Number(value) / 10000)) + "만"} width={52} />
                        <Tooltip
                          formatter={(value) => [won(Number(value)), "월 예상 이용료"]}
                          labelFormatter={(label) => String(label) + "월"}
                        />
                        <Line type="monotone" dataKey="estimated_monthly_revenue" stroke="#9145c9" strokeWidth={3} dot={{ r: 4, fill: "#9145c9" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-xs">
                      <thead className="text-[#81768c]">
                        <tr className="border-b border-[#eee8f2]">
                          <th className="py-2 font-semibold">기준 월</th>
                          <th className="py-2 text-right font-semibold">프리미엄 모임장</th>
                          <th className="py-2 text-right font-semibold">월 예상 이용료</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueTrend.map((item) => (
                          <tr key={item.month_label} className="border-b border-[#f3eff5] last:border-0">
                            <td className="py-2 text-[#665675]">{item.month_label}</td>
                            <td className="py-2 text-right tabular-nums text-[#665675]">{number(item.premium_group_owners)}명</td>
                            <td className="py-2 text-right font-bold tabular-nums text-[#292238]">{won(item.estimated_monthly_revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <section key={card.label} className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                  <p className="text-sm font-semibold text-[#81768c]">{card.label}</p>
                  <p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-[#292238] sm:text-3xl">{card.value}<span className="ml-1 text-base">{card.unit}</span></p>
                  <p className="mt-2 text-xs text-[#9a8da5]">{card.detail}</p>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center text-sm text-[#81768c]">표시할 통계가 없습니다.</div>
        )}
      </div>
    </main>
  );
}
