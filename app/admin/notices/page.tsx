"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const loadNotices = useCallback(async () => {
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
    const { data, error: queryError } = await supabase
      .from("announcements")
      .select("id,title,content,is_published,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    setNotices((data || []) as Notice[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotices();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadNotices);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadNotices]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPublished(true);
    setEditingId(null);
  };

  const startEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setPublished(notice.is_published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveNotice = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      title: title.trim(),
      content: content.trim(),
      is_published: published,
      updated_at: new Date().toISOString(),
    };
    const result = editingId
      ? await supabase.from("announcements").update(payload).eq("id", editingId)
      : await supabase.from("announcements").insert({ ...payload, created_by: userData.user?.id });
    if (result.error) {
      setError(result.error.message);
    } else {
      resetForm();
      await loadNotices();
    }
    setSaving(false);
  };

  const deleteNotice = async (notice: Notice) => {
    if (!window.confirm(`"${notice.title}" 공지사항을 영구 삭제할까요?`)) return;
    const { error: deleteError } = await supabase.from("announcements").delete().eq("id", notice.id);
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === notice.id) resetForm();
      await loadNotices();
    }
  };

  const date = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">공지사항 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">서비스 이용자에게 전달할 공지사항을 관리합니다.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">공지사항을 불러오는 중입니다...</div>
        ) : !authorized ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-[#292238]">접근 권한이 없습니다.</h2>
            <p className="mt-2 text-sm text-[#81768c]">{error}</p>
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white">메인으로 이동</Link>
          </div>
        ) : (
          <>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <section className="mb-6 rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-extrabold text-[#292238]">{editingId ? "공지사항 수정" : "새 공지사항 작성"}</h2>
                {editingId && <button onClick={resetForm} className="text-sm font-semibold text-[#81768c]">수정 취소</button>}
              </div>
              <label className="mb-2 block text-sm font-semibold text-[#665675]">제목</label>
              <input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지사항 제목을 입력하세요" className="mb-4 min-h-11 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4]" />
              <label className="mb-2 block text-sm font-semibold text-[#665675]">내용</label>
              <textarea maxLength={10000} rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지사항 내용을 입력하세요" className="w-full resize-y rounded-xl border border-[#e9e2ef] px-3 py-3 text-sm leading-6 outline-none focus:border-[#a875c4]" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#665675]">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-[#9145c9]" />
                  즉시 게시
                </label>
                <button disabled={saving} onClick={saveNotice} className="rounded-xl bg-[#9145c9] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "저장 중..." : editingId ? "수정 저장" : "공지사항 등록"}</button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
              <div className="border-b border-[#f0eaf3] p-5">
                <h2 className="font-extrabold text-[#292238]">등록된 공지사항 <span className="ml-1 text-sm font-semibold text-[#9874ad]">{notices.length}개</span></h2>
              </div>
              <div className="divide-y divide-[#f2edf5]">
                {notices.map((notice) => (
                  <article key={notice.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={notice.is_published ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700" : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600"}>{notice.is_published ? "게시 중" : "임시저장"}</span>
                        <span className="text-xs text-[#9a8da5]">{date(notice.created_at)}</span>
                      </div>
                      <h3 className="font-bold text-[#292238]">{notice.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#665675]">{notice.content}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => startEdit(notice)} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675]">수정</button>
                      <button onClick={() => deleteNotice(notice)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600">삭제</button>
                    </div>
                  </article>
                ))}
                {notices.length === 0 && <p className="p-10 text-center text-sm text-[#81768c]">등록된 공지사항이 없습니다.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
