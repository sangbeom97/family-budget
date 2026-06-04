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
};

export default function CalendarView({
  items,
  selectedMonth,
}: Props) {
  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [year, month] = selectedMonth
    .split("-")
    .map(Number);

  const firstDay = new Date(
    year,
    month - 1,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const days = [];

  // 빈칸
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // 팝업 데이터
  const selectedItems = items.filter(
    (item) => item.date === selectedDate
  );

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow">
        {/* 요일 */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center font-semibold py-3
              ${
                index === 0
                  ? "text-red-500"
                  : ""
              }
              ${
                index === 6
                  ? "text-blue-500"
                  : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={index}
                  className="border h-36 bg-gray-50"
                />
              );
            }

            const dateString = `${selectedMonth}-${String(
              day
            ).padStart(2, "0")}`;

            const dayItems = items.filter(
              (item) =>
                item.date === dateString
            );

            // 날짜 총합
            const dayTotal = dayItems.reduce(
              (sum, item) => {
                if (
                  item.type === "income"
                ) {
                  return (
                    sum + item.amount
                  );
                }

                return (
                  sum - item.amount
                );
              },
              0
            );

            const isToday =
              dateString === today;

            const weekIndex =
              index % 7;

            return (
              <div
                key={index}
                onClick={() =>
                  setSelectedDate(
                    dateString
                  )
                }
                className="
                  border
                  h-36
                  p-2
                  overflow-y-auto
                  cursor-pointer
                  hover:bg-gray-50
                  transition
                "
              >
                {/* 날짜 */}
                <div
                  className={`
                    flex justify-between items-center mb-1
                  `}
                >
                  <span
                    className={`
                    text-sm font-bold
                    ${
                      weekIndex === 0
                        ? "text-red-500"
                        : ""
                    }
                    ${
                      weekIndex === 6
                        ? "text-blue-500"
                        : ""
                    }
                    ${
                      isToday
                        ? "bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                        : ""
                    }
                  `}
                  >
                    {day}
                  </span>

                  {/* 총합 */}
                  <span
                    className={`text-[10px] font-semibold
                    ${
                      dayTotal >= 0
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    ₩
                    {Math.abs(
                      dayTotal
                    ).toLocaleString()}
                  </span>
                </div>

                {/* 내역 */}
                <div className="space-y-1">
                  {dayItems
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`
                        text-[10px]
                        rounded
                        px-1
                        py-[2px]
                        truncate
                        ${
                          item.type ===
                          "income"
                            ? "bg-blue-100 text-blue-700"
                            : item.spend_type ===
                              "fixed"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                      >
                        {item.name} ₩
                        {item.amount.toLocaleString()}
                      </div>
                    ))}

                  {dayItems.length > 3 && (
                    <div className="text-[10px] text-gray-400">
                      +{dayItems.length - 3}
                      개 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 팝업 */}
      {selectedDate && (
        <div
          className="
            fixed inset-0
            bg-black/40
            flex items-center justify-center
            z-50
          "
          onClick={() =>
            setSelectedDate(null)
          }
        >
          <div
            className="
              bg-white
              rounded-2xl
              p-5
              w-[90%]
              max-w-md
              max-h-[80vh]
              overflow-y-auto
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedDate}
              </h2>

              <button
                onClick={() =>
                  setSelectedDate(null)
                }
                className="text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedItems.length ===
                0 && (
                <p className="text-gray-400">
                  내역 없음
                </p>
              )}

              {selectedItems.map(
                (item) => (
                  <div
                    key={item.id}
                    className="
                    border rounded-xl p-3
                    flex justify-between items-center
                  "
                  >
                    <div>
                      <p className="font-medium">
                        {item.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.category}
                      </p>
                    </div>

                    <div
                      className={
                        item.type ===
                        "income"
                          ? "text-blue-500 font-semibold"
                          : "text-red-500 font-semibold"
                      }
                    >
                      {item.type ===
                      "income"
                        ? "+"
                        : "-"}
                      ₩
                      {item.amount.toLocaleString()}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
