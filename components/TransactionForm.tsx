
"use client";

type Category = {
  id: number;
  name: string;
  type: string;
};

type Props = {
  darkMode: boolean;
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
  categories: Category[];
  currentCategories: string[];
  addItem: () => void;
  editingId: number | null;
};

export default function TransactionForm({
  darkMode,
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
  const inputClass = `w-full min-w-0 min-h-12 rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#3182f6] focus:ring-2 focus:ring-[#3182f6]/15 ${
    darkMode
      ? "bg-slate-700 text-white border-slate-600 placeholder:text-slate-400"
      : "bg-[#f7f8fa] text-[#191f28] border-[#e9edf2] placeholder:text-[#8b95a1]"
  }`;

  return (
    <div
      className={`mb-4 rounded-2xl border p-4 shadow-sm sm:p-5 ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-[#e9edf2]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3
          className={`text-base font-extrabold ${
            darkMode ? "text-white" : "text-[#191f28]"
          }`}
        >
          {editingId ? "내역 수정" : "새 내역 추가"}
        </h3>
        <span className="text-xs font-medium text-[#8b95a1]">
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
              ? "bg-[#f04452] text-white shadow-sm"
              : darkMode
              ? "bg-slate-700 text-slate-300"
              : "bg-[#f7f8fa] text-[#8b95a1]"
          }`}
        >
          지출
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`min-h-12 rounded-xl text-sm font-bold transition-all ${
            type === "income"
              ? "bg-[#3182f6] text-white shadow-sm"
              : darkMode
              ? "bg-slate-700 text-slate-300"
              : "bg-[#f7f8fa] text-[#8b95a1]"
          }`}
        >
          수입
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
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
          <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
            금액
          </label>
          <input
            type="number"
            placeholder="금액 입력"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
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
          <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
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
            <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
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
          <label className="mb-2 block text-xs font-semibold text-[#4e5968]">
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
            : "bg-[#3182f6] text-white hover:bg-[#1b64da]"
        }`}
      >
        {editingId ? "✏️ 수정완료" : "＋ 내역 추가하기"}
      </button>
    </div>
  );
}
