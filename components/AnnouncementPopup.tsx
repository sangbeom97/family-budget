"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

const HIDE_KEY = "jellian_notice_hide_today";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AnnouncementPopup() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hiddenToday, setHiddenToday] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setHiddenToday(localStorage.getItem(HIDE_KEY) === todayKey());

    let active = true;
    const loadNotice = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,content,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active || error || !data) return;
      setNotice(data as Notice);
    };

    loadNotice();
    return () => {
      active = false;
    };
  }, []);

  const hideToday = () => {
    localStorage.setItem(HIDE_KEY, todayKey());
    setHiddenToday(true);
    setExpanded(false);
  };

  if (!notice) return null;

  const date = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(notice.created_at));

  return (
    <div className="mt-auto hidden w-full shrink-0 border-t border-[#f0e8f5] pt-3 md:block">
      <div className="flex items-center justify-between rounded-xl bg-[#fbf7ff] px-2 py-3 md:group-hover:px-3">
        <Link href="/notices" className="flex min-w-0 flex-1 items-center gap-2" aria-label="공지사항 보기">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0e2ff] text-sm">📢</span>
          <span className="hidden truncate text-sm font-extrabold text-[#352443] md:group-hover:inline">공지사항</span>
        </Link>
        {!hiddenToday && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "공지 접기" : "공지 펼치기"}
            className="hidden rounded-lg px-2 py-1 text-lg leading-none text-[#81768c] hover:bg-white md:group-hover:inline"
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </div>

      {!hiddenToday && expanded && (
        <div className="hidden rounded-xl border border-[#eadff2] bg-white p-3 shadow-sm md:group-hover:block">
          <p className="text-[11px] font-semibold text-[#9874ad]">{date}</p>
          <h2 className="mt-1.5 line-clamp-2 text-sm font-extrabold leading-5 text-[#292238]">{notice.title}</h2>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-xs leading-5 text-[#665675]">{notice.content}</p>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f2edf5] pt-3">
            <button
              type="button"
              onClick={hideToday}
              className="text-[11px] font-semibold text-[#93869e] transition-colors hover:text-[#5e5069]"
            >
              오늘 하루 보지 않기
            </button>
            <Link
              href="/notices"
              className="rounded-lg bg-[#9145c9] px-2 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#7f35b7]"
            >
              전체 공지 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
