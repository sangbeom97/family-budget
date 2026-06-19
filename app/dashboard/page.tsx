import { supabase } from "@/lib/supabase"; 
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // 1. 현재 유저가 속한 그룹의 초대 코드를 가져옵니다.
  const { data: groupData } = await supabase
    .from("group_members")
    .select("groups(invite_code)")
    .eq("user_id", session.user.id)
    .single();

  const inviteCode = groupData?.groups?.invite_code || "";

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-3xl font-black">📊 무계획 속 계획</h1>
          {/* 2. 위에서 가져온 inviteCode를 버튼에 전달합니다. */}
          <InviteShareButton inviteCode={inviteCode} />
        </div>
      </div>
    </main>
  );
}
