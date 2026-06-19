import { supabase } from "@/lib/supabase"; 
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

// 🎯 TypeScript를 위한 데이터 구조 정의
type Group = {
  invite_code: string;
};

type GroupMember = {
  groups: Group | Group[] | null;
};

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // 1. 조회 시 타입을 명시합니다.
  const { data: groupMember, error } = await supabase
    .from("group_members")
    .select("groups(invite_code)")
    .eq("user_id", session.user.id)
    .single();

  // 2. 타입을 안전하게 캐스팅하여 사용합니다.
  const memberData = groupMember as unknown as GroupMember;

  const inviteCode = Array.isArray(memberData?.groups) 
    ? memberData?.groups[0]?.invite_code 
    : (memberData?.groups as Group | undefined)?.invite_code;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-3xl font-black mb-4">📊 무계획 속 계획</h1>
          <InviteShareButton inviteCode={inviteCode || ""} />
        </div>
      </div>
    </main>
  );
}
