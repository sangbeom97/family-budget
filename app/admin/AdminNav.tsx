"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/admin/data", label: "데이터 및 운영 관리" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/groups", label: "모임 관리" },
  { href: "/admin/stats", label: "서비스 통계" },
  { href: "/admin/notices", label: "공지사항 관리" },
  { href: "/admin/support", label: "문의 관리" },
  { href: "/admin/activity", label: "작업 이력" },
];

type SupportCountData = {
  unprocessed_count?: number;
};

export default function AdminNav() {
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadUnprocessedCount = async () => {
      const { data, error } = await supabase.rpc("get_jellian_admin_support_requests_page", {
        p_page: 1,
        p_page_size: 1,
        p_search: "",
        p_category: "all",
        p_status: "all",
      });

      if (error) {
        console.error("관리자 미처리 문의 건수 조회 실패:", error);
        return;
      }

      const result = data as SupportCountData | null;
      if (active) setUnprocessedCount(Number(result?.unprocessed_count || 0));
    };

    const initializeNotifications = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session || !active) return;

        const { data: adminCheck, error: adminError } = await supabase.rpc("is_jellian_admin");
        if (adminError) throw adminError;
        if (adminCheck !== true || !active) return;

        await loadUnprocessedCount();
        if (!active) return;

        channel = supabase
          .channel("admin-global-support-requests")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_requests",
            },
            () => {
              setNotice("새 문의가 접수되었습니다.");
              void loadUnprocessedCount();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "support_requests",
            },
            () => {
              void loadUnprocessedCount();
            },
          )
          .subscribe((channelStatus) => {
            if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
              console.error("실시간 문의 알림 연결 실패:", channelStatus);
            }
          });
      } catch (notificationError) {
        console.error("관리자 실시간 문의 알림 초기화 실패:", notificationError);
      }
    };

    void initializeNotifications();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <nav aria-label="관리자 메뉴" className="mb-6 w-full rounded-2xl border border-[#eee8f2] bg-white p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-[#f7f3fa] px-2 py-2.5 text-center text-sm font-bold text-[#665675] transition hover:bg-[#eee4f5] hover:text-[#9145c9]"
            >
              {item.label}
              {item.href === "/admin/support" && unprocessedCount > 0 && (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-amber-800">
                  {unprocessedCount > 99 ? "99+" : unprocessedCount}
                </span>
              )}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex justify-end">
          <Link href="/" className="rounded-xl border border-[#e9e2ef] px-4 py-2.5 text-sm font-bold text-[#81768c] hover:bg-[#fbf8fd]">
            서비스로 돌아가기
          </Link>
        </div>
      </nav>
      {notice && (
        <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{notice} 미처리 {unprocessedCount.toLocaleString("ko-KR")}건</span>
          <div className="flex items-center gap-3">
            <Link href="/admin/support" onClick={() => setNotice("")} className="font-extrabold underline underline-offset-2">문의 확인</Link>
            <button type="button" onClick={() => setNotice("")} aria-label="알림 닫기" className="rounded-md px-2 py-1 hover:bg-amber-100">닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
