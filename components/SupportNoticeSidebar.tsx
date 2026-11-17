"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const accountItems = [
  { href: "/?menu=all", label: "전체", icon: "📊" },
  { href: "/?menu=income", label: "수입", icon: "💰" },
  { href: "/?menu=fixed", label: "고정지출", icon: "🏠" },
  { href: "/?menu=variable", label: "변동지출", icon: "🛒" },
  { href: "/?menu=allowance", label: "용돈", icon: "💳" },
  { href: "/?menu=saving", label: "저축", icon: "🐷" },
  { href: "/?menu=year", label: "연요약", icon: "📈" },
  { href: "/?menu=budget", label: "예산", icon: "🎯" },
  { href: "/?menu=list", label: "리스트", icon: "📋" },
  { href: "/?menu=calendar", label: "달력", icon: "📅" },
];

const serviceItems = [
  { href: "/support", label: "고객지원", icon: "💬" },
  { href: "/notices", label: "공지사항", icon: "📢" },
];

const managementItems = [
  { href: "/?panel=category", label: "카테고리 관리", icon: "📁" },
  { href: "/?panel=members", label: "그룹 멤버", icon: "👥" },
  { href: "/?panel=archived", label: "해체된 모임 관리", icon: "🗑️" },
];

export default function SupportNoticeSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname !== "/support" && pathname !== "/notices") return null;

  const linkClass = (active: boolean) =>
    `mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${
      active ? "bg-[#f3e8ff] text-[#9145c9]" : "text-[#665675] hover:bg-[#fffaff]"
    }`;

  const renderItems = (items: typeof accountItems, isActive: (href: string) => boolean = () => false) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={isActive(item.href) ? "page" : undefined}
        className={linkClass(isActive(item.href))}
      >
        <span className="flex w-7 shrink-0 items-center justify-center text-lg">{item.icon}</span>
        <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">{item.label}</span>
      </Link>
    ));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "사이드바 닫기" : "사이드바 열기"}
        aria-expanded={open}
        className="fixed left-3 top-[4.25rem] z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-[#f0e8f5] bg-white text-xl shadow-sm md:hidden"
      >
        ☰
      </button>

      {open && (
        <button type="button" onClick={() => setOpen(false)} aria-label="메뉴 닫기" className="fixed inset-0 z-40 bg-black/30 md:hidden" />
      )}

      <aside
        aria-label="서비스 사이드바"
        className={`sidebar-scrollbar-hidden group fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col overflow-x-hidden overflow-y-auto border-r border-[#f0e8f5] bg-white p-3 shadow-lg transition-all duration-200 md:top-16 md:h-[calc(100vh-4rem)] md:w-16 md:shadow-sm md:hover:w-56 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <p className="mb-2 px-3 py-2 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">MAIN MENU</p>
        <p className="mb-2 px-3 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">가계부</p>
        {renderItems(accountItems)}

        <div className="my-3 border-t border-[#f0e8f5]" />
        {renderItems(serviceItems, (href) => pathname === href)}

        <div className="my-3 border-t border-[#f0e8f5]" />
        {renderItems(managementItems)}
      </aside>
    </>
  );
}
