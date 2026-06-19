import InviteShareButton from "@/components/InviteShareButton";
import { supabase } from "@/lib/supabase"; // 🎯 createClient 대신 supabase를 직접 임포트!
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. 현재 로그인한 유저 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser(); // 🎯 함수 호출 없이 바로 supabase 객체 사용

  // 로그인이 안 되어 있다면 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/login"); 
  }

  // 2. 유저가 참여 중인 방의 진짜 초대 코드(invite_code) 조회
  const { data: memberData } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups (
        name,
        invite_code
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  // @ts-ignore
  const roomName = memberData?.groups?.name || "내 모임 가계부";
  // @ts-ignore
  const roomInviteCode = memberData?.groups?.invite_code || "";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-850">
        
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

        <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 mb-6 text-sm text-slate-400">
          📊 여기에 가계부 내역과 통계 그래프가 들어옵니다.
        </div>
        
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            멤버 초대하기
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            카톡 링크를 복사해 공유하면 친구가 클릭 한 번으로 합류합니다.
          </p>
          
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
