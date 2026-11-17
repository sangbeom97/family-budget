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

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error: queryError } = await supabase
        .from("announcements")
        .select("id,title,content,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (queryError) setError("공지사항을 불러오지 못했습니다.");
      else setNotices((data || []) as Notice[]);
      setLoading(false);
    };
    load();
  }, []);

  const date = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN NEWS</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">공지사항</h1>
            <p className="mt-1 text-sm text-[#81768c]">Jellian의 새로운 소식과 안내를 확인하세요.</p>
          </div>
          <Link href="/" className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">홈으로</Link>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">불러오는 중입니다...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center text-sm text-red-600">{error}</div>
        ) : notices.length === 0 ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center">
            <p className="text-lg font-bold text-[#292238]">등록된 공지사항이 없습니다.</p>
            <p className="mt-2 text-sm text-[#81768c]">새로운 소식이 등록되면 이곳에서 확인할 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <article key={notice.id} className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
                <p className="text-xs font-semibold text-[#9874ad]">{date(notice.created_at)}</p>
                <h2 className="mt-2 text-lg font-extrabold text-[#292238]">{notice.title}</h2>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#665675]">{notice.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
