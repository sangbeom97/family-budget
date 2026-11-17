
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AnnouncementPopup from "@/components/AnnouncementPopup";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6] hover:text-[#191f28]"
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
            <Link href="/admin" className="rounded-full bg-[#f3e8ff] px-3 py-2 text-sm font-bold text-[#9145c9] transition-colors hover:bg-[#ead8fa]">
              관리자
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
    <AnnouncementPopup />
    </>
  );
}
