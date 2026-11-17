"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SupportRequest = {
  id: string;
  category: string;
  subject: string;
  content: string;
  status: "received" | "in_progress" | "completed";
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

const categoryLabels: Record<string, string> = {
  general: "일반 문의",
  bug: "오류·버그",
  account: "계정",
  data: "데이터",
  suggestion: "개선 제안",
  other: "기타",
};

const statusLabels: Record<string, string> = {
  received: "접수 완료",
  in_progress: "확인 중",
  completed: "답변 완료",
};

const statusStyles: Record<string, string> = {
  received: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function SupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setRequests([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);
    setEmail(userData.user.email || "");
    const { data, error: listError } = await supabase
      .from("support_requests")
      .select("id,category,subject,content,status,admin_response,created_at,updated_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setRequests([]);
    } else {
      const rows = (data || []) as SupportRequest[];
      setRequests(rows);
      setSelectedId((current) => current && rows.some((item) => item.id === current) ? current : rows[0]?.id || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadRequests);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRequests]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!subject.trim() || !content.trim()) {
      setError("제목과 문의 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    const { error: insertError } = await supabase.from("support_requests").insert({
      user_id: userId,
      contact_email: email || null,
      category,
      subject: subject.trim(),
      content: content.trim(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubject("");
      setContent("");
      setCategory("general");
      setMessage("문의가 접수되었습니다. 답변은 이 페이지의 내 문의 내역에서 확인할 수 있습니다.");
      await loadRequests();
    }
    setSubmitting(false);
  };

  const selected = requests.find((item) => item.id === selectedId) || null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 pt-20 pb-8 sm:px-6 md:pt-8 md:pl-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN HELP CENTER</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">고객지원</h1>
            <p className="mt-1 text-sm text-[#81768c]">이용 중 궁금한 점이나 오류를 알려주세요.</p>
          </div>
          <Link href="/" className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675] hover:bg-[#fdfbfe]">
            가계부로 돌아가기
          </Link>
        </div>

        {!userId && !loading ? (
          <section className="rounded-2xl border border-[#eee8f2] bg-white px-5 py-14 text-center">
            <div className="text-4xl">🔐</div>
            <h2 className="mt-4 text-lg font-extrabold text-[#292238]">로그인이 필요합니다.</h2>
            <p className="mt-2 text-sm text-[#81768c]">문의 접수와 내 문의 확인은 로그인 후 이용할 수 있습니다.</p>
            <Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#9145c9] px-5 py-3 text-sm font-bold text-white">로그인하기</Link>
          </section>
        ) : (
          <>
            {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-extrabold text-[#292238]">문의 접수</h2>
                  <p className="mt-1 text-xs leading-5 text-[#81768c]">접수한 문의는 관리자만 확인할 수 있으며, 답변은 오른쪽 내 문의 내역에 표시됩니다.</p>
                </div>
                <form onSubmit={submitRequest} className="space-y-4">
                  <div>
                    <label htmlFor="support-category" className="mb-2 block text-sm font-bold text-[#665675]">문의 유형</label>
                    <select id="support-category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#e9e2ef] bg-white px-3 text-sm outline-none focus:border-[#a875c4]">
                      {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="support-subject" className="mb-2 block text-sm font-bold text-[#665675]">제목</label>
                    <input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} required placeholder="문의 제목을 입력해주세요." className="min-h-11 w-full rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4]" />
                    <p className="mt-1 text-right text-[11px] text-[#a397ad]">{subject.length}/120</p>
                  </div>
                  <div>
                    <label htmlFor="support-content" className="mb-2 block text-sm font-bold text-[#665675]">문의 내용</label>
                    <textarea id="support-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} required rows={8} placeholder="문의하실 내용을 자세히 작성해주세요. 오류라면 발생한 화면과 상황을 함께 적어주시면 도움이 됩니다." className="w-full resize-y rounded-xl border border-[#e9e2ef] px-3 py-3 text-sm leading-6 outline-none focus:border-[#a875c4]" />
                    <p className="mt-1 text-right text-[11px] text-[#a397ad]">{content.length}/5,000</p>
                  </div>
                  <div className="rounded-xl bg-[#faf7fc] px-3 py-3 text-xs leading-5 text-[#81768c]">
                    답변 알림 메일은 아직 지원하지 않습니다. 이 페이지의 내 문의 내역에서 답변을 확인해주세요.
                  </div>
                  <button type="submit" disabled={submitting || loading || !userId} className="min-h-12 w-full rounded-xl bg-[#9145c9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#803bb5] disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? "접수 중..." : "문의 등록하기"}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#eee8f2] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#292238]">내 문의 내역</h2>
                    <p className="mt-1 text-xs text-[#81768c]">접수한 문의와 관리자 답변을 확인할 수 있습니다.</p>
                  </div>
                  <span className="rounded-full bg-[#f3e8ff] px-3 py-1.5 text-xs font-bold text-[#9145c9]">{requests.length}건</span>
                </div>
                {loading ? (
                  <div className="py-16 text-center text-sm text-[#81768c]">문의 내역을 불러오는 중입니다...</div>
                ) : requests.length === 0 ? (
                  <div className="rounded-xl bg-[#fbf9fc] px-4 py-14 text-center">
                    <div className="text-3xl">✉️</div>
                    <p className="mt-3 text-sm font-semibold text-[#81768c]">아직 접수한 문의가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <div className="max-h-[620px] divide-y divide-[#f0eaf3] overflow-y-auto rounded-xl border border-[#f0eaf3]">
                      {requests.map((item) => (
                        <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full px-3 py-4 text-left transition hover:bg-[#fdfbfe] ${selectedId === item.id ? "bg-[#faf5ff]" : "bg-white"}`}>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-[#9145c9]">{categoryLabels[item.category] || item.category}</span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[item.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[item.status] || item.status}</span>
                          </div>
                          <p className="break-words text-sm font-bold text-[#292238]">{item.subject}</p>
                          <p className="mt-1 text-[11px] text-[#9a8da5]">{formatDate(item.created_at)}</p>
                        </button>
                      ))}
                    </div>
                    {selected && (
                      <article className="min-w-0 rounded-xl bg-[#fbf9fc] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[11px] font-bold text-[#9145c9]">{categoryLabels[selected.category] || selected.category}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[selected.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[selected.status] || selected.status}</span>
                        </div>
                        <h3 className="mt-3 break-words text-base font-extrabold text-[#292238]">{selected.subject}</h3>
                        <p className="mt-1 text-[11px] text-[#9a8da5]">접수일 {formatDate(selected.created_at)}</p>
                        <div className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-white p-4 text-sm leading-6 text-[#51465e]">{selected.content}</div>
                        <div className="mt-4">
                          <h4 className="text-sm font-extrabold text-[#665675]">관리자 답변</h4>
                          {selected.admin_response ? (
                            <div className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-[#e9e2ef] bg-white p-4 text-sm leading-6 text-[#51465e]">{selected.admin_response}</div>
                          ) : (
                            <p className="mt-2 rounded-xl border border-dashed border-[#e4dce9] bg-white p-4 text-sm text-[#9a8da5]">아직 등록된 답변이 없습니다.</p>
                          )}
                          {selected.status === "completed" && <p className="mt-2 text-xs font-semibold text-emerald-700">문의 처리가 완료되었습니다.</p>}
                        </div>
                      </article>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
