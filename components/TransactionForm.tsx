
"use client";

type Props = {
  name: string;
  setName: (value: string) => void;
  memo: string;
  setMemo: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  spendType: string;
  setSpendType: (value: string) => void;
  currentCategories: string[];
  addItem: () => void;
  editingId: number | null;
};

export default function TransactionForm({
  name,
  setName,
  memo,
  setMemo,
  amount,
  setAmount,
  date,
  setDate,
  type,
  setType,
  category,
  setCategory,
  spendType,
  setSpendType,
  currentCategories,
  addItem,
  editingId,
}: Props) {
  const inputClass =
    "w-full min-w-0 min-h-12 rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#9145c9] focus:ring-2 focus:ring-[#9145c9]/15 bg-[#fffaff] text-[#292238] border-[#f0e8f5] placeholder:text-[#81768c]";

  return (
        <div
      id="transaction-form"
      className="mb-4 scroll-mt-20 rounded-2xl border p-4 shadow-sm sm:p-5 bg-white border-[#f0e8f5]"
    >
      <div className="mb-5 flex items-center justify-between">
        <h3
          className="text-base font-extrabold text-[#292238]"
        >
          {editingId ? "내역 수정" : "새 내역 추가"}
        </h3>
        <span className="text-xs font-medium text-[#81768c]">
          거래 정보 입력
        </span>
      </div>

      {/* 수입 / 지출 선택 */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`min-h-12 rounded-xl text-sm font-bold transition-all ${
            type === "expense"
              ? "bg-[#e45d94] text-white shadow-sm"
              : "bg-[#fffaff] text-[#81768c]"
          }`}
        >
          지출
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`min-h-12 rounded-xl text-sm font-bold transition-all ${
            type === "income"
              ? "bg-[#9145c9] text-white shadow-sm"
              : "bg-[#fffaff] text-[#81768c]"
          }`}
        >
          수입
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#665675]">
            항목명
          </label>
          <input
            type="text"
            placeholder="예: 마트 장보기"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#665675]">
            금액
          </label>
          <input
  type="text"
  lang="ko"
  placeholder="금액 입력"
  value={amount}
  onPointerDown={(e) => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      e.currentTarget.setAttribute("inputmode", "numeric");
    } else {
      e.currentTarget.removeAttribute("inputmode");
    }
  }}
  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
  className={inputClass}
/>
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#665675]">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#665675]">
            카테고리
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {currentCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {type === "expense" && (
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold text-[#665675]">
              지출 유형
            </label>
            <select
              value={spendType}
              onChange={(e) => setSpendType(e.target.value)}
              className={inputClass}
            >
              <option value="fixed">고정지출</option>
              <option value="variable">변동지출</option>
              <option value="allowance">용돈</option>
              <option value="saving">저축</option>
            </select>
          </div>
        )}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#665675]">
            메모
          </label>
          <input
            type="text"
            placeholder="추가 메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={addItem}
        className={`mt-5 min-h-12 w-full rounded-xl text-sm font-bold shadow-sm transition-all ${
          editingId
            ? "bg-[#f59f00] text-white hover:bg-[#e67700]"
            : "bg-[#9145c9] text-white hover:bg-[#7828c8]"
        }`}
      >
        {editingId ? "✏️ 수정완료" : "＋ 내역 추가하기"}
      </button>
    </div>
  );
}
