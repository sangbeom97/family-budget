import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/");
  }

  // 1. 여기서 데이터를 강제로 다 긁어와 봅니다.
  const { data: test, error } = await supabase
    .from("group_members")
    .select("*, groups(*)")
    .eq("user_id", session.user.id);

  // 2. 서버 로그에 데이터와 에러를 출력합니다 (Vercel 로그에서 확인 가능)
  console.log("--- 디버깅 시작 ---");
  console.log("로그인된 유저 ID:", session.user.id);
  console.log("조회 결과:", test);
  console.log("에러 내용:", error);
  console.log("--- 디버깅 끝 ---");

  return (
    <main className="p-8">
      <h1>📊 디버깅 중... 콘솔(F12)을 확인하세요.</h1>
      <pre className="bg-gray-100 p-4 mt-4">
        {JSON.stringify({ test, error }, null, 2)}
      </pre>
    </main>
  );
}
