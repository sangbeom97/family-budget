import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/");

  // 1. group_members에서 먼저 group_id만 가져오기
  const { data: memberData } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  // 2. 만약 소속된 방이 없다면 초기화면 유지
  if (!memberData) {
    return <main className="p-8"><h1>📊 무계획 속 계획</h1><p>소속된 방이 없습니다.</p></main>;
  }

  // 3. 이제 groups 테이블에서 invite_code만 따로 조회
  const { data: groupData } = await supabase
    .from("groups")
    .select("invite_code")
    .eq("id", memberData.group_id)
    .single();

  return (
    <main className="p-8">
      <h1>📊 무계획 속 계획</h1>
      <InviteShareButton inviteCode={groupData?.invite_code || ""} />
    </main>
  );
}
