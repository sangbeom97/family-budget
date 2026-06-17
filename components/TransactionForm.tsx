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

  categories,
  currentCategories,

  addItem,

  editingId,
}: Props) {
  return (
    <div
      className={`p-5 rounded-2xl shadow-md mb-4 ${
        darkMode
          ? "bg-slate-800"
          : "bg-white/95"
      }`}
    >
      <div className="grid md:grid-cols-7 gap-3">

        <input
          type="text"
          placeholder="항목명"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        />

        <input
          type="text"
          placeholder="메모"
          value={memo}
          onChange={(e) =>
            setMemo(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        />

        <input
          type="number"
          placeholder="금액"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        />

        <input
          type="date"
          value={date}
          onChange={(e) =>
            setDate(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        />

        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        >
          <option value="expense">
            지출
          </option>

          <option value="income">
            수입
          </option>
        </select>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className={`border-2 rounded-xl px-3 py-2 ${
            darkMode
              ? "bg-slate-700 text-white border-slate-600"
              : "bg-white/95 text-black border-gray-300"
          }`}
        >
          {currentCategories.map(
            (item) => (
              <option key={item}>
                {item}
              </option>
            )
          )}
        </select>

        {type === "expense" && (
          <select
            value={spendType}
            onChange={(e) =>
              setSpendType(
                e.target.value
              )
            }
            className={`border-2 rounded-xl px-3 py-2 ${
              darkMode
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-white/95 text-black border-gray-300"
            }`}
          >
            <option value="fixed">
              고정지출
            </option>

            <option value="variable">
              변동지출
            </option>

            <option value="allowance">
              용돈
            </option>

            <option value="saving">
              저축
            </option>
          </select>
        )}
      </div>

      <button
        onClick={addItem}
        className="w-full bg-black text-white rounded-xl py-3 mt-4"
      >
        {editingId
          ? "수정완료"
          : "추가하기"}
      </button>
    </div>
  );
}