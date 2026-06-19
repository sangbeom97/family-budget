'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { joinGroupByCode } from "./actions"; // 💡 서버 액션 파일 연동

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 주소창에서 ?code= 뒤의 값을 자동 추출
  const codeFromUrl = searchParams.get("code") || "";
  const [inviteCode, setInviteCode] = useState(codeFromUrl);

  useEffect(() => {
    if (codeFromUrl) setInviteCode(codeFromUrl);
  }, [codeFromUrl]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) {
      alert("초대 코드를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 💡 Supabase 서버 액션 호출하여 DB 연동 실행
      const result = await joinGroupByCode(inviteCode);

      if (result.success) {
        alert(result.message);
        router.push("/dashboard"); // 성공 시 대시보드로 이동
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("그룹 참여 중 오류 발생:", error);
      alert("처리에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-850 text-center">
      
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
        ✉️
      </div>
      
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        모임 가계부 초대장
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
        Jellian 가계부에 초대받으셨습니다.<br />
        초대 코드가 자동으로 주입되었으니 버튼을 눌러 합류하세요!
      </p>

      <form onSubmit={handleJoinGroup} className="space-y-4">
        <div>
          <label className="block text-left text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            초대 코드
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="코드가 없는 경우 직접 입력"
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-center font-mono font-bold text-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-md transition transform active:scale-[0.98] disabled:opacity-60 disabled:transform-none"
        >
          {isSubmitting ? "모임 방 합류 중..." : "모임 가계부 참여하기 ✨"}
        </button>
      </form>
    </div>
  );
}

export default function InvitePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400 font-medium">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          초대 정보 확인 중...
        </div>
      }>
        <InviteContent />
      </Suspense>
    </main>
  );
}
