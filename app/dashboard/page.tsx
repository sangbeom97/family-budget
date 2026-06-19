import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/");

  // 타입 에러 방지를 위해 any 사용
  const { data: groupMember } = await supabase
    .from("group_members")
    .select("groups(invite_code)")
    .eq("user_id", session.user.id)
    .single() as any;

  const inviteCode = groupMember?.groups?.invite_code || "";

  return (
    <main className="p-8">
      <h1>📊 무계획 속 계획</h1>
      <InviteShareButton inviteCode={inviteCode} />
    </main>
  );
}
