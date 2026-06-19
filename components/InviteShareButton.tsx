'use client';

interface ShareButtonProps {
  inviteCode: string; // 대시보드나 설정 페이지에서 넘겨받을 초대코드 변수
}

export default function InviteShareButton({ inviteCode }: ShareButtonProps) {
  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/invite?code=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert("초대 링크가 클립보드에 복사되었습니다! 카톡에 공유해보세요. ✨");
    } catch (err) {
      console.error("링크 복사 실패:", err);
    }
  };

  return (
    <button
      onClick={handleCopyLink}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
    >
      카카오톡 초대 링크 복사 🔗
    </button>
  );
}
