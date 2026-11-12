
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
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
    <header className="sticky top-0 z-50 w-full border-b border-[#e9edf2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
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

        <nav className="flex items-center gap-2">
          <Link
            href="/blog"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6] hover:text-[#191f28]"
          >
            사용 가이드
          </Link>

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
  );
}
