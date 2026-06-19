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

  // 2. 유저가 참여 중인 방과 방의 초대 코드 조회
  // [주의] 상범님의 group_members.group_id와 groups.id는 UUID 형식입니다.
  const { data: memberData, error } = await supabase
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
    .maybeSingle(); // single() 대신 maybeSingle()로 에러 방지

  // 데이터 추출 안정성 강화
  const rawGroups = memberData?.groups;
  
  // 만약 Supabase 중첩 구조가 배열로 반환될 경우를 대비한 2중 안전장치
  const targetGroup = Array.isArray(rawGroups) ? rawGroups[0] : rawGroups;

  const roomName = targetGroup?.name || "무계획 속 계획";
  const roomInviteCode = targetGroup?.invite_code || "";

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
          
          {/* 진짜 초대 코드가 존재하면 버튼을 띄웁니다 */}
          {roomInviteCode ? (
            <InviteShareButton inviteCode={roomInviteCode} />
          ) : (
            <div className="text-center py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl border border-amber-100 dark:border-amber-900/50">
              ⚠️ 불러온 초대 코드가 없습니다. Supabase 연결 혹은 코드를 재확인해 주세요.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
