
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
  const cardClass = darkMode
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-[#eef0f3] text-[#191f28]";

  const subTextClass = darkMode ? "text-slate-400" : "text-[#8b95a1]";

  const cards = [
    {
      label: "총 수입",
      amount: totalIncome,
      color: "text-[#3182f6]",
    },
    {
      label: "총 지출",
      amount: totalExpense,
      color: "text-[#f04452]",
    },
    {
      label: "총 저축",
      amount: totalSaving,
      color: "text-[#12b886]",
    },
    {
      label: "변동예산",
      amount: monthlyVariableBudget,
      color: "text-[#4e5968]",
    },
    {
      label: "남은 변동예산",
      amount: remainingVariableBudget,
      color: remainingVariableBudget >= 0
        ? "text-[#12b886]"
        : "text-[#f04452]",
    },
  ];

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {/* 핵심 잔액 */}
      <div
        className={`col-span-2 rounded-2xl border p-5 shadow-sm sm:p-6 lg:col-span-3 ${cardClass}`}
      >
        <p className={`mb-2 text-sm font-semibold ${subTextClass}`}>
          실시간 잔액
        </p>
        <h2 className="break-all text-3xl font-extrabold tracking-tight sm:text-4xl">
          ₩{currentBalance.toLocaleString()}
        </h2>
        <p className={`mt-2 text-xs ${subTextClass}`}>
          선택한 기간 및 작성자 기준
        </p>
      </div>

      {/* 나머지 요약 카드 */}
      {cards.map((card) => (
        <div
          key={card.label}
          className={`min-w-0 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 ${cardClass}`}
        >
          <p className={`mb-2 text-sm font-semibold ${subTextClass}`}>
            {card.label}
          </p>
          <p className={`break-all text-lg font-extrabold tracking-tight sm:text-xl ${card.color}`}>
            ₩{card.amount.toLocaleString()}
          </p>
        </div>
      ))}
    </section>
  );
}
