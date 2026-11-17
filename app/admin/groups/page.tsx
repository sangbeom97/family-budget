"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AdminGroup = {
  id: string;
  name: string;
  group_type: string | null;
  created_at: string;
  archived_at: string | null;
  created_by: string | null;
  owner_nickname: string | null;
  owner_email: string | null;
  member_count: number;
};

const typeLabels: Record<string, string> = {
  household: "부부·가정",
  club: "동아리·모임",
  trip: "여행·프로젝트",
  custom: "일반",
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [error, setError] = useState("");

  const loadGroups = useCallback(async () => {
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
    const { data, error: listError } = await supabase.rpc("get_jellian_admin_groups");
    if (listError) {
      setError(listError.message);
      setGroups([]);
    } else {
      setGroups((data || []) as AdminGroup[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGroups();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadGroups);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadGroups]);

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesStatus =
        status === "all" ||
        (status === "active" && !group.archived_at) ||
        (status === "archived" && !!group.archived_at);
      const matchesSearch = !keyword ||
        [group.name, group.owner_nickname || "", group.owner_email || ""]
          .some((value) => value.toLowerCase().includes(keyword));
      return matchesStatus && matchesSearch;
    });
  }, [groups, search, status]);

  const dateLabel = (value: string | null) =>
    value ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "-";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">모임 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">생성된 모임과 해체된 모임의 현황을 확인합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">← 회원 관리</Link>
            <button onClick={loadGroups} className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">새로고침</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">모임 정보를 불러오는 중입니다...</div>
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
              {[
                { label: "전체 모임", value: groups.length },
                { label: "운영 중", value: groups.filter((g) => !g.archived_at).length },
                { label: "해체·보관", value: groups.filter((g) => !!g.archived_at).length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#eee8f2] bg-white p-5">
                  <p className="text-sm font-semibold text-[#81768c]">{item.label}</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#292238]">{item.value.toLocaleString("ko-KR")}<span className="ml-1 text-base">개</span></p>
                </div>
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#f0eaf3] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-extrabold text-[#292238]">전체 모임 목록</h2>
                    <p className="mt-1 text-xs text-[#81768c]">모임 데이터는 조회 전용이며 원본 가계부에는 영향을 주지 않습니다.</p>
                  </div>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="모임명·모임장 검색" className="min-h-10 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4] sm:w-72" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "archived"] as const).map((value) => (
                    <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${status === value ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675] hover:bg-[#eee5f3]"}`}>
                      {value === "all" ? "전체" : value === "active" ? "운영 중" : "해체·보관"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#fbf9fc] text-xs font-bold text-[#81768c]">
                    <tr>
                      <th className="px-5 py-3">모임명</th>
                      <th className="px-5 py-3">유형</th>
                      <th className="px-5 py-3">모임장</th>
                      <th className="px-5 py-3 text-right">인원</th>
                      <th className="px-5 py-3">생성일</th>
                      <th className="px-5 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2edf5]">
                    {filteredGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-[#fdfbfe]">
                        <td className="px-5 py-4 font-bold text-[#292238]">{group.name}</td>
                        <td className="px-5 py-4 text-[#665675]">{typeLabels[group.group_type || "custom"] || "일반"}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#665675]">{group.owner_nickname || "정보 없음"}</p>
                          <p className="mt-0.5 text-xs text-[#9a8da5]">{group.owner_email || "-"}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#665675]">{group.member_count}명</td>
                        <td className="px-5 py-4 text-[#81768c]">{dateLabel(group.created_at)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${group.archived_at ? "bg-[#f1edf3] text-[#81768c]" : "bg-[#eaf8ef] text-[#27834b]"}`}>
                            {group.archived_at ? "해체됨" : "운영 중"}
                          </span>
                          {group.archived_at && <p className="mt-1 text-xs text-[#9a8da5]">{dateLabel(group.archived_at)}</p>}
                        </td>
                      </tr>
                    ))}
                    {filteredGroups.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#81768c]">표시할 모임이 없습니다.</td></tr>}
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
