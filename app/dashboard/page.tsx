import { supabase } from "@/lib/supabase"; // 🎯 기존 인스턴스 사용
import { redirect } from "next/navigation";
import InviteShareButton from "@/components/InviteShareButton";

export default async function DashboardPage() {
  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-3xl font-black">📊 무계획 속 계획</h1>
          <InviteShareButton />
        </div>
      </div>
    </main>
  );
}
