"use client";

import { useState } from "react";

type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
};

type Props = {
  items: Item[];
  selectedMonth: string;
  darkMode: boolean;
};

export default function CalendarView({ items, selectedMonth, darkMode }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [year, month] = selectedMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 선택된 날짜의 가계부 내역들 필터링
  const activeItems = items.filter((item) => {
    if (!selectedDate) return false;
    const dayStr = String(selectedDate).padStart(2, "0");
    return item.date === `${selectedMonth}-${dayStr}`;
  });

  return (
    <>
      <div className={`rounded-2xl p-4 shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map((d, i) => (
            <div key={d} className={`text-xs font-bold py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 달력 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="p-2" />;

            const dayStr = String(day).padStart(2, "0");
            const fullDateStr = `${selectedMonth}-${dayStr}`;
            
            // 해당 날짜의 수입/지출 계산
            const dayItems = items.filter((it) => it.date === fullDateStr);
            const dayExpense = dayItems.filter((it) => it.type !== "income").reduce((sum, it) => sum + it.amount, 0);
            const dayIncome = dayItems.filter((it) => it.type === "income").reduce((sum, it) => sum + it.amount, 0);
            const isSelected = selectedDate === dayStr;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dayStr)}
                className={`p-1.5 min-h-[64px] rounded-xl flex flex-col justify-between items-start transition-all border text-left ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : darkMode
                    ? "border-slate-700 hover:bg-slate-700/50"
                    : "border-gray-50 hover:bg-gray-50"
                }`}
              >
                <span className={`text-xs font-bold ${idx % 7 === 0 ? "text-red-500" : idx % 7 === 6 ? "text-blue-500" : darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  {day}
                </span>
                
                <div className="w-full text-[10px] font-semibold space-y-0.5 overflow-hidden text-right">
                  {dayIncome > 0 && <p className="text-blue-500 truncate">+{dayIncome.toLocaleString()}</p>}
                  {dayExpense > 0 && <p className="text-red-500 truncate">-{dayExpense.toLocaleString()}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 날짜 클릭 시 하단에 상세 내역 모달/리스트 노출 */}
      {selectedDate && (
        <div className={`mt-4 rounded-2xl p-5 border shadow-sm ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-extrabold text-sm">📅 {selectedMonth}-{selectedDate} 상세 내역</h4>
            <button onClick={() => setSelectedDate(null)} className="text-xs text-gray-400 hover:text-gray-500 font-medium">닫기</button>
          </div>

          <div className="space-y-3">
            {activeItems.map((item) => (
              <div key={item.id} className={`flex justify-between items-center p-3 border rounded-xl ${darkMode ? "bg-slate-700/40 border-slate-600" : "bg-gray-50/50 border-gray-100"}`}>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm">{item.name}</p>
                  {item.memo && <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>📝 {item.memo}</p>}
                  <p className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.category}</p>
                </div>
                <div className={`font-extrabold text-sm ${item.type === "income" ? "text-blue-500" : "text-red-500"}`}>
                  {item.type === "income" ? "+" : "-"} ₩{item.amount.toLocaleString()}
                </div>
              </div>
            ))}

            {activeItems.length === 0 && (
              <p className="text-center py-6 text-xs text-gray-400 font-medium">선택한 날짜에 등록된 내역이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
