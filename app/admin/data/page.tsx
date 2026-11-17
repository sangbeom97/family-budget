"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type BackupData = {
  exported_at: string;
  groups: unknown[];
  group_members: unknown[];
  categories: unknown[];
  budgets: unknown[];
  transactions: unknown[];
};

type RestoreCounts = { groups: number; group_members: number; categories: number; budgets: number; transactions: number };

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
  const [restoreBackup, setRestoreBackup] = useState<BackupData | null>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState("");
  const [restoring, setRestoring] = useState(false);
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

  const selectRestoreFile = async (file?: File) => {
    setRestoreBackup(null);
    setRestoreFileName("");
    setRestoreError("");
    setRestoreSuccess("");
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setRestoreError("파일 크기는 25MB를 초과할 수 없습니다.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setRestoreError("JSON 백업 파일만 선택할 수 있습니다.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("올바른 백업 파일 형식이 아닙니다.");
      }
      const candidate = parsed as Record<string, unknown>;
      const keys = ["groups", "group_members", "categories", "budgets", "transactions"] as const;
      for (const key of keys) {
        if (!Array.isArray(candidate[key])) {
          throw new Error(`백업 데이터에 ${key} 배열이 없거나 형식이 올바르지 않습니다.`);
        }
      }
      setRestoreBackup({
        exported_at: typeof candidate.exported_at === "string" ? candidate.exported_at : "",
        groups: candidate.groups as unknown[],
        group_members: candidate.group_members as unknown[],
        categories: candidate.categories as unknown[],
        budgets: candidate.budgets as unknown[],
        transactions: candidate.transactions as unknown[],
      });
      setRestoreFileName(file.name);
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : "백업 파일을 읽을 수 없습니다.");
    }
  };

  const runRestore = async () => {
    if (!restoreBackup || restoring) return;
    const confirmed = window.confirm(
      "정말 복원하시겠습니까? 현재 모임, 멤버 관계, 카테고리, 예산, 거래내역 전체가 선택한 백업 데이터로 교체됩니다. 이 작업은 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setRestoring(true);
    setRestoreError("");
    setRestoreSuccess("");
    try {
      const { data, error: restoreRpcError } = await supabase.rpc("restore_jellian_admin_data_backup", {
        p_backup: restoreBackup,
      });
      if (restoreRpcError) throw restoreRpcError;
      const counts = data as RestoreCounts | null;
      setRestoreSuccess(
        counts
          ? `복원이 완료되었습니다. 모임 ${counts.groups ?? 0}건 · 멤버 관계 ${counts.group_members ?? 0}건 · 카테고리 ${counts.categories ?? 0}건 · 예산 ${counts.budgets ?? 0}건 · 거래내역 ${counts.transactions ?? 0}건`
          : "복원이 완료되었습니다."
      );
      await loadStats();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : "데이터 복원 중 오류가 발생했습니다.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">데이터 및 운영 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">서비스 데이터를 안전하게 백업하고 운영 상태를 관리합니다.</p>
          </div>
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
                <button type="button" onClick={loadStats} disabled={statsLoading} className="rounded-xl border border-[#e9e2ef] px-4 py-2 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd] disabled:opacity-50">
                  {statsLoading ? "조회 중..." : "현황 새로고침"}
                </button>
              </div>
              {statsError ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">데이터 현황을 불러오지 못했습니다. SQL 설정 여부를 확인하세요. ({statsError})</p>
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
                          {Number(value).toLocaleString("ko-KR")}<span className="ml-1 text-xs font-semibold text-[#81768c]">{unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#9a90a2]">마지막 조회: {new Date(stats.checked_at).toLocaleString("ko-KR")}</p>
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
                <div className="rounded-xl bg-[#faf9fb] p-4"><p className="text-sm font-bold text-[#665675]">백업에 포함되는 데이터</p><p className="mt-2 text-sm leading-6 text-[#81768c]">모임 정보 · 멤버 관계 · 카테고리 · 월별 예산 · 전체 거래내역</p></div>
                <div className="rounded-xl bg-[#faf9fb] p-4"><p className="text-sm font-bold text-[#665675]">백업 방식</p><p className="mt-2 text-sm leading-6 text-[#81768c]">관리자 권한 확인 후 서버에서 데이터를 읽어 브라우저로 JSON 파일을 생성합니다.</p></div>
              </div>
              <button type="button" onClick={downloadBackup} disabled={exporting} className="min-h-11 rounded-xl bg-[#796982] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#66576f] disabled:cursor-not-allowed disabled:opacity-50">
                {exporting ? "백업 파일 생성 중..." : "전체 데이터 백업 다운로드"}
              </button>
              {lastExport && <p className="mt-3 text-xs text-[#81768c]">최근 다운로드: {lastExport}</p>}
              {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            </section>

            <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff1e8] text-xl">♻️</div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#292238]">백업 데이터 복원</h2>
                  <p className="mt-1 text-sm leading-6 text-[#81768c]">이전에 다운로드한 Jellian JSON 백업 파일을 선택해 데이터를 복원합니다.</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">주의: 기존 데이터가 교체됩니다.</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">복원하면 현재 모임, 모임 멤버 관계, 카테고리, 예산, 거래내역이 백업 파일의 내용으로 전부 교체됩니다. 회원 정보와 고객 문의는 변경하지 않습니다.</p>
              </div>
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-[#665675]">백업 파일 선택 (JSON, 최대 25MB)</span>
                <input type="file" accept=".json,application/json" onChange={(event) => selectRestoreFile(event.target.files?.[0])} className="block w-full cursor-pointer rounded-xl border border-[#e9e2ef] bg-[#faf9fb] p-3 text-sm text-[#665675] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eee6f4] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#665675]" />
              </label>
              {restoreFileName && restoreBackup && (
                <div className="mt-4 rounded-xl bg-[#faf9fb] p-4">
                  <p className="text-sm font-bold text-[#292238]">선택된 파일: {restoreFileName}</p>
                  <p className="mt-1 text-xs text-[#81768c]">백업 생성 시각: {restoreBackup.exported_at ? new Date(restoreBackup.exported_at).toLocaleString("ko-KR") : "정보 없음"}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {([
                      ["모임", restoreBackup.groups.length],
                      ["멤버 관계", restoreBackup.group_members.length],
                      ["카테고리", restoreBackup.categories.length],
                      ["예산", restoreBackup.budgets.length],
                      ["거래내역", restoreBackup.transactions.length],
                    ] as [string, number][]).map(([label, count]) => (
                      <div key={label} className="rounded-lg bg-white p-3"><p className="text-xs text-[#81768c]">{label}</p><p className="mt-1 text-lg font-extrabold tabular-nums text-[#292238]">{count.toLocaleString("ko-KR")}</p></div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#81768c]">파일 구조 검사를 통과했습니다. 실제 복원은 아래 버튼을 누르고 최종 확인해야 시작됩니다.</p>
                </div>
              )}
              {restoreError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{restoreError}</p>}
              {restoreSuccess && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{restoreSuccess}</p>}
              <button type="button" onClick={runRestore} disabled={!restoreBackup || restoring} className="mt-5 min-h-11 rounded-xl bg-[#a45b37] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#88482b] disabled:cursor-not-allowed disabled:opacity-40">
                {restoring ? "데이터 복원 중..." : "선택한 백업으로 데이터 복원"}
              </button>
            </section>

            <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <h2 className="font-extrabold text-[#292238]">백업 및 복원 유의사항</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#81768c]">
                <li>복원 전 현재 데이터를 먼저 백업하는 것을 권장합니다.</li>
                <li>복원 대상은 모임, 멤버 관계, 카테고리, 예산, 거래내역이며 회원 정보와 고객 문의는 변경하지 않습니다.</li>
                <li>복원은 관리자 권한으로만 실행되며, 데이터베이스 오류가 발생하면 전체 변경이 롤백됩니다.</li>
                <li>백업 파일에는 개인 거래내역과 모임 정보가 포함되므로 안전한 장소에 보관하세요.</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
