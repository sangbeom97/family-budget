
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e9edf2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">

        {/* 왼쪽: 로고 */}
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

        {/* 오른쪽: 사용 가이드 */}
        <nav className="flex items-center">
          <Link
            href="/blog"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6] hover:text-[#191f28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6]"
          >
            사용 가이드
          </Link>
        </nav>

      </div>
    </header>
  );
}
