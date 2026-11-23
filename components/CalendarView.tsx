"use client";

import { useEffect, useMemo, useState } from "react";
import { getDaysInMonth } from "@/lib/dateUtils";

type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  memo: string;
};

type Props = {
  items: Item[];
  selectedMonth: string;
};

export default function CalendarView({ items, selectedMonth }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(null);
  }, [selectedMonth]);

  const [year, month] = selectedMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const dailyTotals = useMemo(() => {
    const totals = new Map<string, { income: number; expense: number }>();

    for (const item of items) {
      const current = totals.get(item.date) ?? { income: 0, expense: 0 };
      if (item.type === "income") {
        current.income += Number(item.amount);
      } else {
        current.expense += Number(item.amount);
      }
      totals.set(item.date, current);
    }

    return totals;
  }, [items]);

  const activeItems = useMemo(
    () =>
      selectedDate
        ? items.filter((item) => item.date === `${selectedMonth}-${selectedDate}`)
        : [],
    [items, selectedDate, selectedMonth]
  );

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`py-1 text-xs font-bold ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                    ? "text-[#9145c9]"
                    : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-2" />;
            }

            const dayString = String(day).padStart(2, "0");
            const fullDate = `${selectedMonth}-${dayString}`;
            const totals = dailyTotals.get(fullDate);
            const isSelected = selectedDate === dayString;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : dayString)}
                aria-pressed={isSelected}
                className={`flex min-h-[64px] flex-col items-start justify-between rounded-xl border p-1.5 text-left transition-all ${
                  isSelected
                    ? "border-[#9145c9] bg-[#9145c9]/10"
                    : "border-gray-50 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    index % 7 === 0
                      ? "text-red-500"
                      : index % 7 === 6
                        ? "text-[#9145c9]"
                        : "text-gray-700"
                  }`}
                >
                  {day}
                </span>

                <div className="w-full space-y-0.5 overflow-hidden text-right text-[10px] font-semibold">
                  {totals?.income ? (
                    <p className="truncate text-[#9145c9]">
                      +{totals.income.toLocaleString()}
                    </p>
                  ) : null}
                  {totals?.expense ? (
                    <p className="truncate text-red-500">
                      -{totals.expense.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 text-gray-900 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-extrabold">
              📅 {selectedMonth}-{selectedDate} 상세 내역
            </h4>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs font-medium text-gray-400 hover:text-gray-500"
            >
              닫기
            </button>
          </div>

          <div className="space-y-3">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">{item.name}</p>
                  {item.memo && (
                    <p className="text-xs text-gray-500">📝 {item.memo}</p>
                  )}
                  <p className="text-[11px] text-gray-500">{item.category}</p>
                </div>
                <div
                  className={`text-sm font-extrabold ${
                    item.type === "income" ? "text-[#9145c9]" : "text-red-500"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"} ₩
                  {Number(item.amount).toLocaleString()}
                </div>
              </div>
            ))}

            {activeItems.length === 0 && (
              <p className="py-6 text-center text-xs font-medium text-gray-400">
                선택한 날짜에 등록된 내역이 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
