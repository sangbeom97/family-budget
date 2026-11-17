"use client";

import { useCallback, useEffect, useState } from "react";
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
  member_list_view: "회원 목록 조회",
  group_list_view: "모임 목록 조회",
  support_list_view: "문의 목록 조회",
};

const actionColors: Record<string, string> = {
  notice_create: "bg-green-50 text-green-700",
  notice_update: "bg-blue-50 text-blue-700",
  notice_delete: "bg-red-50 text-red-700",
  data_backup: "bg-violet-50 text-violet-700",
  data_restore: "bg-amber-50 text-amber-800",
  support_update: "bg-[#f3eef7] text-[#665675]",
  member_list_view: "bg-sky-50 text-sky-700",
  group_list_view: "bg-teal-50 text-teal-700",
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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
    const { data, error: queryError } = await supabase.rpc("get_jellian_admin_activity_logs_page", {
      p_page: page,
      p_page_size: pageSize,
      p_search: searchTerm || null,
      p_action: filter === "all" ? null : filter,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });
    if (queryError) {
      setError(queryError.message);
      setLogs([]);
      setFilteredCount(0);
    } else {
      const result = data as { total_count?: number; today_count?: number; filtered_count?: number; logs?: ActivityLog[] };
      setLogs(result?.logs || []);
      setTotalCount(Number(result?.total_count || 0));
      setTodayCount(Number(result?.today_count || 0));
      setFilteredCount(Number(result?.filtered_count || 0));
    }
    setLoading(false);
  }, [page, searchTerm, filter, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const paginatedLogs = logs;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

        {loading && !authorized ? (
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
            {loading && <p className="mb-3 text-xs text-[#9874ad]">검색 결과를 업데이트하고 있습니다...</p>}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">전체 기록</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{totalCount.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">오늘 작업</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{todayCount.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[#eee8f2] bg-white p-5 sm:col-span-1">
                <p className="text-sm font-semibold text-[#81768c]">현재 검색 결과</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{filteredCount.toLocaleString("ko-KR")}<span className="ml-1 text-base">건</span></p>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#f0eaf3] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-extrabold text-[#292238]">작업 기록 목록</h2>
                    <p className="mt-1 text-xs text-[#81768c]">전체 작업 이력을 최신순으로 조회합니다.</p>
                  </div>
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="작업 내용·관리자·대상 ID 검색" className="min-h-10 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4] sm:w-72" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#81768c]">시작일 <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-[#e9e2ef] px-2 text-sm text-[#665675]" /></label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#81768c]">종료일 <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-[#e9e2ef] px-2 text-sm text-[#665675]" /></label>
                  {(startDate || endDate || search || filter !== "all") && <button onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); setFilter("all"); setPage(1); }} className="min-h-10 rounded-xl px-3 text-xs font-bold text-[#9145c9] hover:bg-[#f8f2fb]">필터 초기화</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setFilter("all"); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === "all" ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675]"}`}>전체</button>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <button key={key} onClick={() => { setFilter(key); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === key ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675]"}`}>{label}</button>
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
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} className="cursor-pointer hover:bg-[#fdfbfe]">
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
                          <p className="mt-1 text-xs font-semibold text-[#9874ad]">상세 보기 →</p>
                        </td>
                      </tr>
                    ))}
                    {filteredCount === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-[#81768c]">기록이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#f0eaf3] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-[#81768c]">총 {filteredCount.toLocaleString("ko-KR")}건 중 {filteredCount === 0 ? 0 : ((page - 1) * pageSize + 1).toLocaleString("ko-KR")}–{Math.min(page * pageSize, filteredCount).toLocaleString("ko-KR")}건 표시 · {page}/{totalPages}페이지</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675] disabled:opacity-40">처음</button>
                  <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675] disabled:opacity-40">이전</button>
                  <span className="min-w-16 text-center text-sm font-bold tabular-nums text-[#292238]">{page} / {totalPages}</span>
                  <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675] disabled:opacity-40">다음</button>
                  <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675] disabled:opacity-40">마지막</button>
                </div>
              </div>
            </section>
          </>
        )}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedLog(null)}>
            <section role="dialog" aria-modal="true" aria-labelledby="activity-detail-title" onClick={(event) => event.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold tracking-[0.15em] text-[#9874ad]">ACTIVITY DETAIL</p><h2 id="activity-detail-title" className="mt-2 text-xl font-extrabold text-[#292238]">{actionLabels[selectedLog.action] || selectedLog.action}</h2><p className="mt-1 text-sm text-[#81768c]">{dateTime(selectedLog.created_at)}</p></div>
                <button onClick={() => setSelectedLog(null)} aria-label="닫기" className="rounded-lg px-3 py-2 text-lg text-[#81768c] hover:bg-[#f5f0f8]">✕</button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#faf8fc] p-4"><p className="text-xs font-semibold text-[#9a8da5]">관리자</p><p className="mt-1 font-bold text-[#292238]">{selectedLog.actor_nickname || "관리자"}</p><p className="mt-1 break-all text-xs text-[#81768c]">{selectedLog.actor_email || "-"}</p></div>
                <div className="rounded-xl bg-[#faf8fc] p-4"><p className="text-xs font-semibold text-[#9a8da5]">대상</p><p className="mt-1 font-bold text-[#292238]">{selectedLog.target_type || "-"}</p><p className="mt-1 break-all text-xs text-[#81768c]">{selectedLog.target_id || "대상 ID 없음"}</p></div>
              </div>
              <div className="mt-4"><p className="text-xs font-bold text-[#81768c]">작업 내용</p><p className="mt-1 rounded-xl border border-[#eee8f2] p-4 text-sm font-semibold text-[#665675]">{selectedLog.summary}</p></div>
              <div className="mt-4"><p className="text-xs font-bold text-[#81768c]">상세 데이터</p>{Object.keys(selectedLog.details || {}).length > 0 ? <pre className="mt-2 overflow-x-auto rounded-xl bg-[#292238] p-4 text-xs leading-6 text-white">{JSON.stringify(selectedLog.details, null, 2)}</pre> : <p className="mt-2 rounded-xl bg-[#faf8fc] p-4 text-sm text-[#9a8da5]">추가 상세 데이터가 없습니다.</p>}</div>
              <div className="mt-5 flex justify-end"><button onClick={() => setSelectedLog(null)} className="rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white">닫기</button></div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
