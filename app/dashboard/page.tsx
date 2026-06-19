import InviteShareButton from "@/components/InviteShareButton";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. 현재 로그인한 유저 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인이 안 되어 있다면 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/login"); 
  }

  // 2. [구조 수정] 내가 만든 방(created_by = 내 user.id) 기준으로 groups 테이블에서 직접 조회
  const { data: groupData, error } = await supabase
    .from("groups")
    .select("name, invite_code")
    .eq("created_by", user.id) // 🎯 상범님의 기존 DB 매싱 구조 적용!
    .limit(1)
    .maybeSingle();

  // 데이터 할당 (값이 없으면 기본값 처리)
  const roomName = groupData?.name || "무계획 속 계획";
  const roomInviteCode = groupData?.invite_code || "";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-850">
        
        {/* 상단 타이틀 */}
        <div className="mb-6">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
            Dashboard
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-2 mb-1">
            {roomName} 대시보드
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            성공적으로 데이터베이스와 연결되었습니다.
          </p>
        </div>

        {/* 중앙 가계부 프리뷰 영역 */}
        <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 mb-6 text-sm text-slate-400">
          📊 여기에 가계부 내역과 통계 그래프가 들어옵니다.
        </div>
        
        {/* 하단 멤버 초대 영역 */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            멤버 초대하기
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            카톡 링크를 복사해 공유하면 친구가 클릭 한 번으로 합류합니다.
          </p>
          
          {/* 🎯 이제 정상적으로 jellian 코드가 잡히므로 복사 버튼이 뜹니다! */}
          {roomInviteCode ? (
            <InviteShareButton inviteCode={roomInviteCode} />
          ) : (
            <div className="text-center py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl border border-amber-100 dark:border-amber-900/50">
              ⚠️ 생성된 초대 코드가 없습니다. Supabase에서 코드를 입력해 주세요!
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
