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
  };

  if (!notice || hiddenToday) return null;

  const date = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(notice.created_at));

  return (
    <section className="mb-5 hidden w-full items-center gap-4 rounded-2xl border border-[#eadcf5] bg-gradient-to-r from-[#fbf5ff] to-white px-4 py-3 shadow-sm md:flex md:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e2ff] text-xl" aria-hidden="true">
        📢
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#9145c9]">JELLIAN NOTICE</span>
          <span className="text-[11px] text-[#a397ad]">{date}</span>
        </div>
        <h2 className="truncate text-sm font-extrabold text-[#352443]">{notice.title}</h2>
        <p className="mt-1 line-clamp-1 text-xs text-[#766782]">{notice.content}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={hideToday}
          className="rounded-lg px-2 py-2 text-xs font-semibold text-[#93869e] transition-colors hover:bg-[#f6effb] hover:text-[#5e5069]"
        >
          오늘 하루 보지 않기
        </button>
        <Link
          href="/notices"
          className="rounded-lg bg-[#9145c9] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#7f35b7]"
        >
          자세히 보기
        </Link>
      </div>
    </section>
  );
}
