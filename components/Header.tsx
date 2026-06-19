import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* 왼쪽: 로고 영역 */}
        <div className="flex items-center">
          <Link href="/" className="transition hover:opacity-90">
            <Image
              src="/images/logo.png" // 👈 public 폴더 기준 경로
              alt="Jellian 로고"
              width={130} // 로고 너비 (원하는 크기로 조절)
              height={36} // 로고 높이
              className="object-contain"
              priority // 상단 로고는 빠르게 로딩되도록 최우선순위 지정
            />
          </Link>
        </div>

        {/* 오른쪽: 간단한 가이드 메뉴 및 로그인 버튼 예시 */}
        <div className="flex items-center gap-4">
          <Link 
            href="/blog" 
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            사용 가이드
          </Link>
          {/* 이미 로그인 기능이 구현되어 있다면 여기에 맞게 교체하시면 됩니다 */}
        </div>

      </div>
    </header>
  );
}
