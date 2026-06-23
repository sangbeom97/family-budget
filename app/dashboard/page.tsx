import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // 로그인 안 됐으면 메인으로
  if (!session) redirect("/");

  // 사용자가 속한 첫 번째 그룹 조회
  const { data: memberData } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  // 방이 있으면 groupId를 URL 파라미터로 붙여서 메인으로 리다이렉트
  if (memberData) {
    redirect(`/?groupId=${memberData.group_id}`);
  }

  // 방이 없는 경우
  return (
    <main className="p-8">
      <h1>📊 무계획 속 계획</h1>
      <p>소속된 방이 없습니다.</p>
    </main>
  );
}