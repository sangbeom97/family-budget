
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [inquiryAlert, setInquiryAlert] = useState(false);
  const previousInquiryCount = useRef<number | null>(null);

  const checkNewInquiries = useCallback(async (notify = false) => {
    const { count, error } = await supabase.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "received");
    if (error) { console.error("새 문의 확인 실패:", error); return; }
    const nextCount = count || 0;
    setNewInquiryCount(nextCount);
    if (previousInquiryCount.current !== null && nextCount > previousInquiryCount.current && notify) {
      const added = nextCount - previousInquiryCount.current;
      setInquiryAlert(true);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Jellian 새 문의", { body: "새로운 문의 " + added + "건이 접수되었습니다.", tag: "jellian-support-request" });
      }
    }
    previousInquiryCount.current = nextCount;
  }, []);

  useEffect(() => {
    const updateAccess = async (session: { user: { id: string } } | null) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase.rpc("is_jellian_admin");
      setIsAdmin(!error && data === true);
    };

    supabase.auth.getSession().then(({ data }) => {
      updateAccess(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAccess(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) { previousInquiryCount.current = null; setNewInquiryCount(0); setInquiryAlert(false); return; }
    checkNewInquiries(false);
    const interval = window.setInterval(() => checkNewInquiries(true), 20000);
    const handleFocus = () => checkNewInquiries(true);
    window.addEventListener("focus", handleFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", handleFocus); };
  }, [isAdmin, checkNewInquiries]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) { alert("이 브라우저는 알림을 지원하지 않습니다."); return; }
    const permission = await Notification.requestPermission();
    if (permission === "granted") new Notification("Jellian 알림이 켜졌습니다.", { body: "새 문의가 접수되면 브라우저 알림을 보내드립니다." });
  };

  const handleSignOut = async () => {
    localStorage.removeItem("currentGroupId");

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`로그아웃 실패: ${error.message}`);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-[#e9edf2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={(event) => {
            if (window.location.pathname === "/") {
              event.preventDefault();
              window.location.reload();
            }
          }}
          className="flex items-center transition-opacity hover:opacity-80"
          aria-label="Jellian 홈"
        >
          <Image
            src="/images/logo.png"
            alt="Jellian 로고"
            width={130}
            height={36}
            className="h-auto w-[112px] object-contain sm:w-[130px]"
            priority
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/intro"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#8e42c8] transition-colors hover:bg-[#fbf2ff]"
          >
            서비스 소개
          </Link>
          <Link
            href="/notices"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6] hover:text-[#191f28] md:hidden"
          >
            공지사항
          </Link>
          <Link
            href="/blog"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6] hover:text-[#191f28]"
          >
            사용 가이드
          </Link>

          {isLoggedIn && isAdmin && (
            <Link href="/admin" className="relative rounded-full bg-[#f3e8ff] px-3 py-2 text-sm font-bold text-[#9145c9] transition-colors hover:bg-[#ead8fa]">
              관리자
              {newInquiryCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">{newInquiryCount > 99 ? "99+" : newInquiryCount}</span>}
            </Link>
          )}

          {!isLoggedIn && (
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              로그인
            </Link>
          )}

          {isLoggedIn && (
            <button
              onClick={handleSignOut}
              className="rounded-full bg-[#f04452] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#d93644]"
            >
              로그아웃
            </button>
          )}
        </nav>
      </div>
    </header>
    {isLoggedIn && isAdmin && inquiryAlert && (
      <div className="fixed right-4 top-20 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#e9d9f3] bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff] text-xl">✉️</span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-[#292238]">새 문의가 접수되었습니다.</p>
            <p className="mt-1 text-sm text-[#81768c]">미처리 문의 {newInquiryCount}건이 있습니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/support" onClick={() => setInquiryAlert(false)} className="rounded-lg bg-[#9145c9] px-3 py-2 text-xs font-bold text-white">문의 확인</Link>
              {"Notification" in window && Notification.permission === "default" && <button onClick={handleEnableNotifications} className="rounded-lg border border-[#e9e2ef] px-3 py-2 text-xs font-bold text-[#665675]">브라우저 알림 켜기</button>}
            </div>
          </div>
          <button onClick={() => setInquiryAlert(false)} aria-label="알림 닫기" className="text-lg leading-none text-[#9a8da5]">×</button>
        </div>
      </div>
    )}
    </>
  );
}
