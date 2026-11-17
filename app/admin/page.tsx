"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AdminMember = {
  id: string;
  email: string | null;
  nickname: string | null;
  created_at: string;
  group_count: number;
};

export default function AdminPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

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
    const { data, error: listError } = await supabase.rpc("get_jellian_admin_members");
    if (listError) {
      setError(listError.message);
      setMembers([]);
    } else {
      setMembers((data || []) as AdminMember[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadMembers();
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) =>
      [member.nickname || "", member.email || ""].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
  }, [members, search]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">회원 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">Jellian 서비스에 가입한 회원을 확인합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/notices" className="rounded-xl bg-[#f3e8ff] px-4 py-2.5 text-sm font-bold text-[#9145c9] hover:bg-[#ead8fa]">
              공지사항 관리
            </Link>
            <Link
              href="/admin/stats"
              className="rounded-xl bg-[#f3e8ff] px-4 py-2.5 text-sm font-bold text-[#9145c9] hover:bg-[#ead8fa]"
            >
              서비스 통계
            </Link>
            <Link
              href="/admin/groups"
              className="rounded-xl bg-[#f3e8ff] px-4 py-2.5 text-sm font-bold text-[#9145c9] hover:bg-[#ead8fa]"
            >
              모임 관리
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd]"
            >
              서비스로 돌아가기
            </Link>
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
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{members.length.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">그룹에 가입한 회원</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{members.filter((member) => member.group_count > 0).length.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                <p className="text-sm font-semibold text-[#81768c]">현재 검색 결과</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{filteredMembers.length.toLocaleString("ko-KR")}<span className="ml-1 text-base">명</span></p>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#f0eaf3] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="font-extrabold text-[#292238]">가입 회원 목록</h2>
                  <p className="mt-1 text-xs text-[#81768c]">가입일 최신순으로 표시됩니다.</p>
                </div>
                <div className="flex gap-2">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이메일 또는 닉네임 검색" className="min-h-10 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4] sm:w-64" />
                  <button onClick={loadMembers} className="shrink-0 rounded-xl border border-[#e9e2ef] px-3 text-sm font-bold text-[#665675] hover:bg-[#fbf8fd]">새로고침</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#fbf9fc] text-xs font-bold text-[#81768c]">
                    <tr>
                      <th className="px-5 py-3">회원</th>
                      <th className="px-5 py-3">이메일</th>
                      <th className="px-5 py-3">가입일</th>
                      <th className="px-5 py-3 text-right">가입 그룹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2edf5]">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-[#fdfbfe]">
                        <td className="px-5 py-4 font-bold text-[#292238]">{member.nickname || "닉네임 없음"}</td>
                        <td className="px-5 py-4 text-[#665675]">{member.email || "-"}</td>
                        <td className="px-5 py-4 text-[#81768c]">{formatDate(member.created_at)}</td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#665675]">{member.group_count}개</td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-[#81768c]">검색 결과가 없습니다.</td></tr>
                    )}
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
