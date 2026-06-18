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
  
  // 공통 입력창 스타일 정의
  const inputClass = `border-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors outline-none focus:border-blue-500 ${
    darkMode
      ? "bg-slate-700 text-white border-slate-600 placeholder:text-gray-400"
      : "bg-white text-black border-gray-200 placeholder:text-gray-400"
  }`;

  return (
    <div
      className={`p-5 rounded-2xl shadow-sm border mb-4 ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
      }`}
    >
      {/* 입력 필드 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <input
          type="text"
          placeholder="항목명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <input
          type="text"
          placeholder="메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className={inputClass}
        />

        <input
          type="number"
          placeholder="금액"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>

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

        {type === "expense" ? (
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
        ) : (
          /* 지출이 아닐 때(수입일 때) 레이아웃 정렬 유지를 위한 빈 공간 확보 */
          <div className="hidden lg:block" />
        )}
      </div>

      {/* 등록 / 수정완료 버튼 */}
      <button
        onClick={addItem}
        className={`w-full rounded-xl py-3 mt-4 text-sm font-bold shadow-sm transition-all ${
          editingId
            ? "bg-amber-500 text-white hover:bg-amber-600"
            : darkMode
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "bg-black text-white hover:bg-zinc-800"
        }`}
      >
        {editingId ? "✏️ 수정완료" : "➕ 추가하기"}
      </button>
    </div>
  );
}
