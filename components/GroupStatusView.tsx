type GroupStatusViewProps = {
  mode: "loading" | "empty";
};

export default function GroupStatusView({ mode }: GroupStatusViewProps) {
  if (mode === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#f0e8f5] bg-white shadow-sm">
        <div className="text-sm font-semibold text-[#81768c]">
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#d9e0e8] bg-white px-4 py-20 text-center shadow-sm sm:py-24">
      <span className="mb-4 block text-5xl">🏠</span>
      <p className="text-lg font-bold text-[#292238]">
        활성화된 가계부 방이 존재하지 않습니다.
      </p>
      <p className="mt-2 text-sm leading-6 text-[#81768c]">
        상단에서 새 가계부를 개설하거나 다른 가계부에 초대받아야 내역 관리가 가능합니다.
      </p>
    </div>
  );
}
