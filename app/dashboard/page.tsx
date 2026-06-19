import { supabase } from "@/lib/supabase"; 
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // 1. 현재 유저가 속한 그룹의 정보를 조회하여 초대 코드를 가져옵니다.
  const { data: groupMember, error } = await supabase
    .from("group_members")
    .select("groups(invite_code)")
    .eq("user_id", session.user.id)
    .single();

  // groupMember?.groups는 객체이거나 배열일 수 있습니다. 
  // 데이터 구조에 따라 접근 방식을 아래와 같이 안전하게 처리합니다.
  const inviteCode = Array.isArray(groupMember?.groups) 
    ? groupMember?.groups[0]?.invite_code 
    : groupMember?.groups?.invite_code;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-3xl font-black mb-4">📊 무계획 속 계획</h1>
          
          {/* 2. 이제 inviteCode를 필수로 전달하므로 타입 에러가 발생하지 않습니다. */}
          <InviteShareButton inviteCode={inviteCode || ""} />
        </div>
      </div>
    </main>
  );
}
