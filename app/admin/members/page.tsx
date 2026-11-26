"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type AdminMember = {
  id: string;
  email: string | null;
  nickname: string | null;
  created_at: string;
  group_count: number;
  account_status: "active" | "expelled" | "blacklisted";
  status_reason: string | null;
};

type MemberPageData = {
  total_count: number;
  group_member_count: number;
  filtered_count: number;
  members: AdminMember[];
};

const PAGE_SIZE = 20;

export default function AdminPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, groupMembers: 0, filtered: 0 });
  const [error, setError] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMembers = useCallback(async () => {
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
    if (adminError || !adminCheck) {
      setAuthorized(false);
      setError("관리자 계정만 접근할 수 있습니다.");
      setLoading(false);
      return;
    }

    setAuthorized(true);
    const { data, error: listError } = await supabase.rpc("get_jellian_admin_members_page", {
      p_page: page,
      p_page_size: PAGE_SIZE,
      p_search: searchTerm,
    });

    if (listError) {
      setError(listError.message);
      setMembers([]);
    } else {
      const result = data as MemberPageData;
      setMembers(result?.members || []);
      setStats({
        total: Number(result?.total_count || 0),
        groupMembers: Number(result?.group_member_count || 0),
        filtered: Number(result?.filtered_count || 0),
      });
    }
    setLoading(false);
  }, [page, searchTerm]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const changeMemberStatus = async (
    member: AdminMember,
    status: "active" | "expelled" | "blacklisted",
  ) => {
    const actionLabel = status === "expelled" ? "제명" : status === "blacklisted" ? "블랙리스트 등록" : "이용 허용";
    const reason = status === "active"
      ? null
      : window.prompt(`${member.nickname || member.email || "회원"} 회원의 ${actionLabel} 사유를 입력해 주세요. (선택)`, "");

    if (status !== "active" && reason === null) return;
    if (!window.confirm(`${member.nickname || member.email || "선택한 회원"}을(를) ${actionLabel} 처리할까요?${status === "active" ? "" : "\\n기존 가계부 데이터는 삭제되지 않습니다."}`)) return;

    setUpdatingMemberId(member.id);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");

      const response = await fetch("/api/admin/members/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: member.id, status, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "회원 상태 변경에 실패했습니다.");

      await loadMembers();
      window.alert(`${actionLabel} 처리가 완료되었습니다.`);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "회원 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(stats.filtered / PAGE_SIZE));
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">회원 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">Jellian 서비스에 가입한 회원을 확인합니다.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">회원 정보를 불러오는 중입니다...</div>
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
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">전체 회원</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{stats.total.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">그룹에 가입한 회원</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{stats.groupMembers.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">검색 결과</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{stats.filtered.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#f0eaf3] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="font-extrabold text-[#292238]">가입 회원 목록</h2>
                  <p className="mt-1 text-xs text-[#81768c]">가입일 최신순 · 페이지당 {PAGE_SIZE}명</p>
                </div>
                <div className="flex gap-2">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이메일 또는 닉네임 검색" className="min-h-10 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4] sm:w-64" />
                  <button onClick={loadMembers} className="shrink-0 rounded-xl border border-[#e9e2ef] px-3 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd]">새로고침</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#fbf9fc] text-xs font-bold text-[#81768c]">
                    <tr><th className="px-5 py-3">회원</th><th className="px-5 py-3">이메일</th><th className="px-5 py-3">가입일</th><th className="px-5 py-3 text-right">가입 그룹</th><th className="px-5 py-3">상태</th><th className="px-5 py-3">관리</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2edf5]">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-[#fdfbfe]">
                        <td className="px-5 py-4 font-bold text-[#292238]">{member.nickname || "닉네임 없음"}</td>
                        <td className="px-5 py-4 text-[#665675]">{member.email || "-"}</td>
                        <td className="px-5 py-4 text-[#81768c]">{formatDate(member.created_at)}</td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#665675]">{member.group_count}개</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            member.account_status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : member.account_status === "expelled"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}>
                            {member.account_status === "active" ? "정상" : member.account_status === "expelled" ? "제명" : "블랙리스트"}
                          </span>
                          {member.status_reason && <p className="mt-1 max-w-40 truncate text-xs text-[#81768c]" title={member.status_reason}>{member.status_reason}</p>}
                        </td>
                        <td className="px-5 py-4">
                          {member.account_status === "active" ? (
                            <div className="flex gap-2">
                              <button disabled={updatingMemberId === member.id} onClick={() => changeMemberStatus(member, "expelled")} className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-40">제명</button>
                              <button disabled={updatingMemberId === member.id} onClick={() => changeMemberStatus(member, "blacklisted")} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40">블랙리스트</button>
                            </div>
                          ) : (
                            <button disabled={updatingMemberId === member.id} onClick={() => changeMemberStatus(member, "active")} className="rounded-lg border border-[#e9e2ef] px-2.5 py-1.5 text-xs font-bold text-[#665675] disabled:opacity-40">
                              {updatingMemberId === member.id ? "처리 중..." : "이용 허용"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#81768c]">검색 결과가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#f0eaf3] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-[#81768c]">{stats.filtered.toLocaleString("ko-KR")}명 중 {stats.filtered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, stats.filtered)}명 표시</p>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-sm font-bold text-[#665675] disabled:opacity-40">이전</button>
                  <span className="min-w-20 text-center text-sm font-semibold text-[#665675]">{page} / {totalPages}</span>
                  <button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-sm font-bold text-[#665675] disabled:opacity-40">다음</button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
