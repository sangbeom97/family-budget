"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type BackupData = {
  exported_at: string;
  groups: unknown[];
  group_members: unknown[];
  categories: unknown[];
  budgets: unknown[];
  transactions: unknown[];
};

type DataStats = {
  checked_at: string;
  members: number;
  groups: number;
  group_members: number;
  categories: number;
  budgets: number;
  transactions: number;
  support_requests: number;
};

export default function AdminDataPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState("");
  const [stats, setStats] = useState<DataStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");
    const { data, error: statsLoadError } = await supabase.rpc("get_jellian_admin_data_stats");
    if (statsLoadError) {
      setStatsError(statsLoadError.message);
      setStats(null);
    } else {
      setStats(data as DataStats);
    }
    setStatsLoading(false);
  }, []);

  const checkAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setAuthorized(false);
      setError("로그인 후 이용할 수 있습니다.");
      setLoading(false);
      return;
    }
    const { data, error: adminError } = await supabase.rpc("is_jellian_admin");
    if (adminError || data !== true) {
      setAuthorized(false);
      setError("관리자 계정만 접근할 수 있습니다.");
      setLoading(false);
      return;
    }
    setAuthorized(true);
    await loadStats();
    setLoading(false);
  }, [loadStats]);

  useEffect(() => {
    checkAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(checkAdmin);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkAdmin]);

  const downloadBackup = async () => {
    setExporting(true);
    setError("");
    try {
      const { data, error: backupError } = await supabase.rpc("get_jellian_admin_data_backup");
      if (backupError) throw backupError;
      if (!data || typeof data !== "object") throw new Error("백업 데이터를 가져오지 못했습니다.");

      const backup = data as BackupData;
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `jellian-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setLastExport(new Date().toLocaleString("ko-KR"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "백업 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">데이터 및 운영 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">서비스 데이터를 안전하게 백업하고 운영 상태를 관리합니다.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">← 관리자 홈</Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">권한을 확인하고 있습니다...</div>
        ) : !authorized ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center">
            <div className="text-3xl">🔒</div>
            <h2 className="mt-3 text-lg font-bold text-[#292238]">접근 권한이 없습니다.</h2>
            <p className="mt-2 text-sm text-[#81768c]">{error}</p>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white">메인으로 이동</Link>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#292238]">서비스 데이터 현황</h2>
                  <p className="mt-1 text-sm text-[#81768c]">현재 데이터베이스에 저장된 항목별 전체 건수입니다.</p>
                </div>
                <button
                  type="button"
                  onClick={loadStats}
                  disabled={statsLoading}
                  className="rounded-xl border border-[#e9e2ef] px-4 py-2 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd] disabled:opacity-50"
                >
                  {statsLoading ? "조회 중..." : "현황 새로고침"}
                </button>
              </div>
              {statsError ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  데이터 현황을 불러오지 못했습니다. SQL 설정 여부를 확인하세요. ({statsError})
                </p>
              ) : stats ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {[
                      ["전체 회원", stats.members, "명"],
                      ["모임", stats.groups, "개"],
                      ["모임 참여 관계", stats.group_members, "건"],
                      ["카테고리", stats.categories, "개"],
                      ["예산", stats.budgets, "건"],
                      ["거래내역", stats.transactions, "건"],
                      ["고객 문의", stats.support_requests, "건"],
                    ].map(([label, value, unit]) => (
                      <div key={String(label)} className="rounded-xl bg-[#faf9fb] p-4">
                        <p className="text-xs font-semibold text-[#81768c]">{label}</p>
                        <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#292238]">
                          {Number(value).toLocaleString("ko-KR")}
                          <span className="ml-1 text-xs font-semibold text-[#81768c]">{unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#9a90a2]">
                    마지막 조회: {new Date(stats.checked_at).toLocaleString("ko-KR")}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-[#81768c]">{statsLoading ? "데이터 현황을 불러오고 있습니다..." : "표시할 데이터가 없습니다."}</p>
              )}
            </section>

            <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff] text-xl">💾</div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#292238]">전체 데이터 백업</h2>
                  <p className="mt-1 text-sm leading-6 text-[#81768c]">모임, 그룹 멤버, 카테고리, 예산, 거래내역을 JSON 파일 하나로 내려받습니다.</p>
                </div>
              </div>

              <div className="my-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#faf9fb] p-4">
                  <p className="text-sm font-bold text-[#665675]">백업에 포함되는 데이터</p>
                  <p className="mt-2 text-sm leading-6 text-[#81768c]">모임 정보 · 멤버 관계 · 카테고리 · 월별 예산 · 전체 거래내역</p>
                </div>
                <div className="rounded-xl bg-[#faf9fb] p-4">
                  <p className="text-sm font-bold text-[#665675]">백업 방식</p>
                  <p className="mt-2 text-sm leading-6 text-[#81768c]">관리자 권한 확인 후 서버에서 데이터를 읽어 브라우저로 JSON 파일을 생성합니다.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadBackup}
                disabled={exporting}
                className="min-h-11 rounded-xl bg-[#796982] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#66576f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? "백업 파일 생성 중..." : "전체 데이터 백업 다운로드"}
              </button>
              {lastExport && <p className="mt-3 text-xs text-[#81768c]">최근 다운로드: {lastExport}</p>}
              {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            </section>

            <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <h2 className="font-extrabold text-[#292238]">백업 시 유의사항</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#81768c]">
                <li>이 기능은 데이터를 내려받기만 하며 서비스의 원본 데이터는 변경하지 않습니다.</li>
                <li>백업 파일에는 거래내역과 모임 구성 정보가 포함되므로 안전한 장소에 보관하세요.</li>
                <li>현재는 JSON 백업만 지원하며, 파일을 이용한 복원 기능은 제공하지 않습니다.</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
