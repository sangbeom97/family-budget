type Props = {
  darkMode: boolean;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  currentBalance: number;
  monthlyVariableBudget: number;
  remainingVariableBudget: number;
};

export default function SummaryCards({
  darkMode,
  totalIncome,
  totalExpense,
  totalSaving,
  currentBalance,
  monthlyVariableBudget,
  remainingVariableBudget,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          총 수입
        </p>

        <h2 className="text-2xl font-extrabold text-blue-500">
          ₩{totalIncome.toLocaleString()}
        </h2>
      </div>

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          총 지출
        </p>

        <h2 className="text-2xl font-extrabold text-red-500">
          ₩{totalExpense.toLocaleString()}
        </h2>
      </div>

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          총 저축
        </p>

        <h2 className="text-2xl font-extrabold text-green-500">
          ₩{totalSaving.toLocaleString()}
        </h2>
      </div>

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          실시간 잔액
        </p>

        <h2 className="text-2xl font-extrabold">
          ₩{currentBalance.toLocaleString()}
        </h2>
      </div>

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          변동예산
        </p>

        <h2 className="text-2xl font-extrabold">
          ₩{monthlyVariableBudget.toLocaleString()}
        </h2>
      </div>

      <div
        className={`p-6 min-h-[100px] rounded-2xl shadow-md ${darkMode
            ? "bg-slate-800"
            : "bg-white/95"
          }`}
      >
        <p className="text-sm font-semibold">
          남은 변동예산
        </p>

        <h2
          className={`text-2xl font-extrabold ${remainingVariableBudget >= 0
              ? "text-green-500"
              : "text-red-500"
            }`}
        >
          ₩{remainingVariableBudget.toLocaleString()}
        </h2>
      </div>

    </div>
  );
}