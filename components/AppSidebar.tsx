import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { MainTab, AccountViewMode } from "@/hooks/useAppNavigationState";

type AccountFilter = "all" | "income" | "fixed" | "variable" | "allowance" | "saving";

type AccountMenuItem = {
  id: AccountFilter | "year" | "budget" | "list" | "calendar";
  label: string;
  icon: string;
  filter?: AccountFilter;
  view: AccountViewMode;
};

const accountMenuItems = [
  { id: "all", label: "전체", icon: "📊", filter: "all", view: "list" },
  { id: "income", label: "수입", icon: "💰", filter: "income", view: "list" },
  { id: "fixed", label: "고정지출", icon: "🏠", filter: "fixed", view: "list" },
  { id: "variable", label: "변동지출", icon: "🛒", filter: "variable", view: "list" },
  { id: "allowance", label: "용돈", icon: "💳", filter: "allowance", view: "list" },
  { id: "saving", label: "저축", icon: "🐷", filter: "saving", view: "list" },
  { id: "year", label: "연요약", icon: "📈", view: "year" },
  { id: "budget", label: "예산", icon: "🎯", view: "budget" },
  { id: "list", label: "리스트", icon: "📋", view: "list" },
  { id: "calendar", label: "달력", icon: "📅", view: "calendar" },
] satisfies AccountMenuItem[];

const managementMenuItems = [
  { id: "category", label: "카테고리 관리", icon: "📁" },
  { id: "members", label: "그룹 멤버", icon: "👥" },
  { id: "archived", label: "해체된 모임 관리", icon: "🗑️" },
] satisfies Array<{
  id: Exclude<MainTab, "account">;
  label: string;
  icon: string;
}>;

type Props = {
  mainTab: MainTab;
  setMainTab: Dispatch<SetStateAction<MainTab>>;
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
  view: AccountViewMode;
  setView: Dispatch<SetStateAction<AccountViewMode>>;
  role: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export default function AppSidebar({
  mainTab,
  setMainTab,
  filter,
  setFilter,
  view,
  setView,
  role,
  isSidebarOpen,
  setIsSidebarOpen,
}: Props) {
  return (
    <>
{/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed left-3 top-16 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[#f0e8f5] bg-white text-xl shadow-sm md:hidden"
          aria-label="메뉴 열기"
        >
          ☰
        </button>

        {/* 모바일 사이드바 배경 */}
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            aria-label="메뉴 닫기"
          />
        )}

        {/* 사이드바 */}
        <aside
          className={`sidebar-scrollbar-hidden group fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-[#f0e8f5] bg-white p-3 shadow-lg transition-all duration-200 md:top-16 md:h-[calc(100vh-4rem)] md:w-16 md:shadow-sm md:hover:w-56 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="mb-4 px-3 py-2 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">
            MAIN MENU
          </div>

                    <div className="mb-2 px-3 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">
            가계부
          </div>

          {accountMenuItems
            .filter((item) => item.id !== "budget" || role !== "member")
            .map((item) => {
              const active =
                mainTab === "account" &&
                (item.filter
                  ? filter === item.filter && view === "list"
                  : view === item.view);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMainTab("account");
                    if (item.filter) setFilter(item.filter);
                    setView(item.view);
                    setIsSidebarOpen(false);
                  }}
                  className={`mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${
                    active
                      ? "bg-[#f3e8ff] text-[#9145c9]"
                      : "text-[#665675] hover:bg-[#fffaff]"
                  }`}
                >
                  <span className="flex w-7 shrink-0 items-center justify-center text-lg">
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              );
            })}

          <div className="my-3 border-t border-[#f0e8f5]" />

          {managementMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMainTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${
                mainTab === item.id
                  ? "bg-[#f3e8ff] text-[#9145c9]"
                  : "text-[#665675] hover:bg-[#fffaff]"
              }`}
            >
              <span className="flex w-7 shrink-0 items-center justify-center text-lg">
                {item.icon}
              </span>
              <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          ))}

          <div className="my-3 border-t border-[#f0e8f5]" />

          <Link
            href="/support"
            onClick={() => setIsSidebarOpen(false)}
            className="mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-[#665675] transition-all hover:bg-[#fffaff]"
          >
            <span className="flex w-7 shrink-0 items-center justify-center text-lg">💬</span>
            <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              고객지원
            </span>
          </Link>

          <Link
            href="/notices"
            onClick={() => setIsSidebarOpen(false)}
            className="mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-[#665675] transition-all hover:bg-[#fffaff]"
          >
            <span className="flex w-7 shrink-0 items-center justify-center text-lg">📢</span>
            <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              공지사항
            </span>
          </Link>
        </aside>
    </>
  );
}
