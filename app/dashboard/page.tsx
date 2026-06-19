import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  // 🎯 에러 원인이던 기존 createClient 대신, Next.js 서버 컴포넌트 전용 Supabase 클라이언트를 생성합니다.
  const supabase = createServerComponentClient({ cookies });

  // 현재 로그인된 유저 세션 가져오기
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 로그인이 되어 있지 않다면 메인 로그인 화면으로 리다이렉트
  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 대시보드 상단 헤더 영역 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">📊 무계획 속 계획</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              공유 가계부에 오신 것을 환영합니다!
            </p>
          </div>
          
          {/* 초대 링크 복사 버튼 (기존 컴포넌트 연동) */}
          <div className="flex items-center gap-2">
            <InviteShareButton />
          </div>
        </div>

        {/* 가계부 메인 콘텐츠 영역 (기존에 작성해두신 UI나 기능을 이 아래에 이어서 자유롭게 배치하시면 됩니다) */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border min-h-[400px] flex items-center justify-center text-slate-400">
          여기에 가계부 내역 및 데이터 테이블이 렌더링됩니다.
        </div>

      </div>
    </main>
  );
}
