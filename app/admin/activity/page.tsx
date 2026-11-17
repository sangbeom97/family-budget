"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type ActivityLog = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_nickname: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};

const actionLabels: Record<string, string> = {
  notice_create: "공지 등록",
  notice_update: "공지 수정",
  notice_delete: "공지 삭제",
  data_backup: "데이터 백업",
  data_restore: "데이터 복원",
  support_update: "문의 처리",
};

const actionColors: Record<string, string> = {
  notice_create: "bg-green-50 text-green-700",
  notice_update: "bg-blue-50 text-blue-700",
  notice_delete: "bg-red-50 text-red-700",
  data_backup: "bg-violet-50 text-violet-700",
  data_restore: "bg-amber-50 text-amber-800",
  support_update: "bg-[#f3eef7] text-[#665675]",
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadLogs = useCallback(async () => {
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
    const { data, error: queryError } = await supabase.rpc("get_jellian_admin_activity_logs", { p_limit: 500 });
    if (queryError) {
      setError(queryError.message);
      setLogs([]);
    } else {
      setLogs((data || []) as ActivityLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadLogs);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesFilter = filter === "all" || log.action === filter;
      const matchesSearch = !keyword || [
        log.summary,
        log.actor_email || "",
        log.actor_nickname || "",
        log.target_id || "",
      ].some((value) => value.toLowerCase().includes(keyword));
      return matchesFilter && matchesSearch;
    });
  }, [logs, search, filter]);

  const dateTime = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(new Date(value));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">관리자 작업 이력</h1>
            <p className="mt-1 text-sm text-[#81768c]">관리자 계정의 주요 변경 및 운영 작업을 기록합니다.</p>
          </div>
          <button onClick={loadLogs} disabled={loading} className="min-h-10 rounded-xl border border-[#e9e2ef] bg-white px-4 py-2 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd] disabled:opacity-50">
            {loading ? "조회 중..." : "새로고침"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">작업 이력을 불러오는 중입니다...</div>
        ) : !authorized ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center">
            <div className="text-3xl">🔒</div>
            <h2 className="mt-3 text-lg font-bold text-[#292238]">접근 권한이 없습니다.</h2>
            <p className="mt-2 text-sm text-[#81768c]">{error}</p>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white">메인으로 이동</Link>
          </div>
        ) : (
          <>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">전체 기록</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{logs.length.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">오늘 작업</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{logs.filter((log) => new Date(log.created_at).toDateString() === new Date().toDateString()).length.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[#eee8f2] bg-white p-5 sm:col-span-1">
                <p className="text-sm font-semibold text-[#81768c]">현재 검색 결과</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{filteredLogs.length.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#f0eaf3] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-extrabold text-[#292238]">작업 기록 목록</h2>
                    <p className="mt-1 text-xs text-[#81768c]">최근 500건을 최신순으로 표시합니다.</p>
                  </div>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="작업 내용·관리자 검색" className="min-h-10 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4] sm:w-72" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilter("all")} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === "all" ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675]"}`}>전체</button>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === key ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675]"}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#fbf9fc] text-xs font-bold text-[#81768c]">
                    <tr>
                      <th className="px-5 py-3">일시</th>
                      <th className="px-5 py-3">관리자</th>
                      <th className="px-5 py-3">작업</th>
                      <th className="px-5 py-3">내용</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2edf5]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#fdfbfe]">
                        <td className="whitespace-nowrap px-5 py-4 text-[#81768c]">{dateTime(log.created_at)}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#292238]">{log.actor_nickname || "관리자"}</p>
                          <p className="mt-0.5 text-xs text-[#9a8da5]">{log.actor_email || "-"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>{actionLabels[log.action] || log.action}</span>
                        </td>
                        <td className="max-w-[420px] px-5 py-4">
                          <p className="break-words font-semibold text-[#665675]">{log.summary}</p>
                          {log.target_id && <p className="mt-1 break-all text-xs text-[#9a8da5]">대상 ID: {log.target_id}</p>}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-[#81768c]">기록이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
