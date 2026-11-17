"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";
import { supabase } from "@/lib/supabase";

type SupportRequest = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  nickname: string | null;
  contact_email: string | null;
  category: string;
  subject: string;
  content: string;
  status: "received" | "in_progress" | "completed";
  admin_response: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupportEvent = {
  id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
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
  received: "접수",
  in_progress: "처리 중",
  completed: "완료",
};

const statusStyles: Record<string, string> = {
  received: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selected, setSelected] = useState<SupportRequest | null>(null);
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [response, setResponse] = useState("");
  const [nextStatus, setNextStatus] = useState<SupportRequest["status"]>("received");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async () => {
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
    const { data, error: listError } = await supabase.rpc("get_jellian_admin_support_requests");
    if (listError) {
      setError(listError.message);
      setRequests([]);
    } else {
      const rows = (data || []) as SupportRequest[];
      setRequests(rows);
      setSelected((current) => current ? rows.find((item) => item.id === current.id) || null : null);
    }
    setLoading(false);
  }, []);

  const loadEvents = useCallback(async (requestId: string) => {
    const { data, error: eventsError } = await supabase
      .from("support_request_events")
      .select("id,event_type,old_status,new_status,note,created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    if (eventsError) {
      setError(eventsError.message);
      setEvents([]);
    } else {
      setEvents((data || []) as SupportEvent[]);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      Promise.resolve().then(loadRequests);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRequests]);

  useEffect(() => {
    if (selected) {
      setResponse(selected.admin_response || "");
      setNextStatus(selected.status);
      loadEvents(selected.id);
    } else {
      setEvents([]);
      setResponse("");
    }
  }, [selected?.id, loadEvents]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = status === "all" || item.status === status;
      const matchesSearch = !keyword || [
        item.subject, item.content, item.nickname || "",
        item.user_email || "", item.contact_email || "",
      ].some((value) => value.toLowerCase().includes(keyword));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [requests, search, category, status]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { error: saveError } = await supabase.rpc("update_jellian_admin_support_request", {
      p_request_id: selected.id,
      p_status: nextStatus,
      p_admin_response: response,
    });
    if (saveError) {
      setError(saveError.message);
    } else {
      setNotice("문의 처리 내용이 저장되었습니다.");
      await loadRequests();
      await loadEvents(selected.id);
    }
    setSaving(false);
  };

  const counts = {
    all: requests.length,
    received: requests.filter((item) => item.status === "received").length,
    in_progress: requests.filter((item) => item.status === "in_progress").length,
    completed: requests.filter((item) => item.status === "completed").length,
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminNav />
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9874ad]">JELLIAN BACK OFFICE</p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#292238] sm:text-3xl">문의 및 오류 관리</h1>
            <p className="mt-1 text-sm text-[#81768c]">회원 문의와 오류 제보를 확인하고 처리합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">회원 관리</Link>
            <button onClick={loadRequests} className="rounded-xl border border-[#e9e2ef] bg-white px-4 py-2.5 text-sm font-bold text-[#665675]">새로고침</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eee8f2] bg-white p-12 text-center text-sm text-[#81768c]">문의 내역을 불러오는 중입니다...</div>
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
            {notice && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "전체 문의", value: counts.all },
                { label: "접수", value: counts.received },
                { label: "처리 중", value: counts.in_progress },
                { label: "완료", value: counts.completed },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#eee8f2] bg-white p-4 sm:p-5">
                  <p className="text-sm font-semibold text-[#81768c]">{item.label}</p>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#292238]">{item.value.toLocaleString("ko-KR")}<span className="ml-1 text-sm">건</span></p>
                </div>
              ))}
            </div>

            <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <div className="overflow-hidden rounded-2xl border border-[#eee8f2] bg-white">
                <div className="space-y-3 border-b border-[#f0eaf3] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제목·내용·회원 검색" className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#e9e2ef] px-3 text-sm outline-none focus:border-[#a875c4]" />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-10 rounded-xl border border-[#e9e2ef] bg-white px-3 text-sm text-[#665675]">
                      <option value="all">전체 유형</option>
                      {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "received", "in_progress", "completed"] as const).map((value) => (
                      <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${status === value ? "bg-[#9145c9] text-white" : "bg-[#f5f0f8] text-[#665675] hover:bg-[#eee5f3]"}`}>
                        {value === "all" ? "전체" : statusLabels[value]}
                      </button>
                    ))}
                    <span className="ml-auto self-center text-xs text-[#9a8da5]">{filtered.length}건</span>
                  </div>
                </div>
                <div className="max-h-[720px] divide-y divide-[#f2edf5] overflow-y-auto">
                  {filtered.map((item) => (
                    <button key={item.id} onClick={() => { setSelected(item); setNotice(""); }} className={`block w-full px-4 py-4 text-left transition hover:bg-[#fdfbfe] ${selected?.id === item.id ? "bg-[#faf5ff]" : ""}`}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[11px] font-bold text-[#9145c9]">{categoryLabels[item.category] || item.category}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[item.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[item.status] || item.status}</span>
                        <span className="ml-auto text-[11px] text-[#9a8da5]">{dateTime(item.created_at)}</span>
                      </div>
                      <p className="font-bold text-[#292238]">{item.subject}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#81768c]">{item.content}</p>
                      <p className="mt-2 text-xs text-[#9a8da5]">{item.nickname || "회원 정보 없음"} · {item.user_email || item.contact_email || "연락처 없음"}</p>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="p-10 text-center text-sm text-[#81768c]">조건에 맞는 문의가 없습니다.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-[#eee8f2] bg-white p-5 sm:p-6">
                {!selected ? (
                  <div className="py-16 text-center">
                    <div className="text-3xl">✉️</div>
                    <p className="mt-3 text-sm font-semibold text-[#81768c]">왼쪽 목록에서 문의를 선택하세요.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 border-b border-[#f0eaf3] pb-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f3e8ff] px-2.5 py-1 text-xs font-bold text-[#9145c9]">{categoryLabels[selected.category] || selected.category}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[selected.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[selected.status]}</span>
                      </div>
                      <h2 className="text-lg font-extrabold text-[#292238]">{selected.subject}</h2>
                      <p className="mt-2 text-xs leading-5 text-[#9a8da5]">작성자: {selected.nickname || "회원 정보 없음"} · {selected.user_email || selected.contact_email || "연락처 없음"}</p>
                      <p className="mt-1 text-xs text-[#9a8da5]">접수일: {dateTime(selected.created_at)}</p>
                    </div>
                    <div className="mb-6 whitespace-pre-wrap break-words rounded-xl bg-[#fbf9fc] p-4 text-sm leading-6 text-[#51465e]">{selected.content}</div>

                    <label className="mb-2 block text-sm font-bold text-[#665675]">처리 상태</label>
                    <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as SupportRequest["status"])} className="mb-4 min-h-11 w-full rounded-xl border border-[#e9e2ef] bg-white px-3 text-sm outline-none focus:border-[#a875c4]">
                      <option value="received">접수</option>
                      <option value="in_progress">처리 중</option>
                      <option value="completed">완료</option>
                    </select>
                    <label className="mb-2 block text-sm font-bold text-[#665675]">관리자 답변 및 처리 메모</label>
                    <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={5} maxLength={5000} placeholder="답변 또는 내부 처리 내용을 입력하세요." className="w-full resize-y rounded-xl border border-[#e9e2ef] px-3 py-3 text-sm leading-6 outline-none focus:border-[#a875c4]" />
                    <button disabled={saving} onClick={save} className="mt-3 w-full rounded-xl bg-[#9145c9] px-5 py-3 text-sm font-bold text-white hover:bg-[#803bb5] disabled:opacity-50">{saving ? "저장 중..." : "처리 내용 저장"}</button>

                    <div className="mt-7 border-t border-[#f0eaf3] pt-5">
                      <h3 className="mb-3 font-extrabold text-[#292238]">처리 이력</h3>
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div key={event.id} className="border-l-2 border-[#e6d5f2] pl-3">
                            <p className="text-xs font-bold text-[#665675]">{event.old_status ? statusLabels[event.old_status] || event.old_status : "신규"} → {statusLabels[event.new_status || ""] || event.new_status || "기록"} · {dateTime(event.created_at)}</p>
                            {event.note && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#81768c]">{event.note}</p>}
                          </div>
                        ))}
                        {events.length === 0 && <p className="text-xs text-[#9a8da5]">아직 처리 이력이 없습니다.</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
