import Link from "next/link";

const items = [
  { href: "/admin/data", label: "데이터 및 운영 관리" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/groups", label: "모임 관리" },
  { href: "/admin/stats", label: "서비스 통계" },
  { href: "/admin/notices", label: "공지사항 관리" },
  { href: "/admin/support", label: "문의 관리" },
  { href: "/admin/activity", label: "작업 이력" },
];

export default function AdminNav() {
  return (
    <nav aria-label="관리자 메뉴" className="mb-6 w-full rounded-2xl border border-[#eee8f2] bg-white p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-[#f7f3fa] px-2 py-2.5 text-center text-sm font-bold text-[#665675] transition hover:bg-[#eee4f5] hover:text-[#9145c9]"
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <Link href="/" className="rounded-xl border border-[#e9e2ef] px-4 py-2.5 text-sm font-bold text-[#81768c] hover:bg-[#fbf8fd]">
          서비스로 돌아가기
        </Link>
      </div>
    </nav>
  );
}
