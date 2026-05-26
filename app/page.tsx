"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";

type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);

  const [view, setView] =
    useState("list");

  const [filter, setFilter] =
    useState("all");

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const [type, setType] =
    useState("expense");

  const [category, setCategory] =
    useState("식비");

  const [spendType, setSpendType] =
    useState("variable");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [date, setDate] =
    useState(today);

  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7);

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  // 불러오기
  const fetchItems = async () => {
    const startDate = new Date(
      `${selectedMonth}-01`
    );

    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    const start = startDate
      .toISOString()
      .split("T")[0];

    const end = endDate
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, [selectedMonth]);

  // 추가
  const addItem = async () => {
    if (
      name.trim() === "" ||
      amount.trim() === ""
    ) {
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .insert([
        {
          name,
          amount: Number(amount),
          type,
          category,
          spend_type: spendType,
          date,
        },
      ]);

    if (error) {
      console.log(error);
      return;
    }

    setName("");
    setAmount("");

    fetchItems();
  };

  // 삭제
  const deleteItem = async (id: number) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    fetchItems();
  };

  // 필터링
  const filteredItems =
    filter === "all"
      ? items
      : items.filter(
          (item) =>
            item.spend_type === filter
        );

  // 총합
  const total = filteredItems.reduce(
    (sum, item) => {
      if (item.type === "income") {
        return sum + item.amount;
      }

      return sum - item.amount;
    },
    0
  );

  // 차트 데이터
  const categoryData = Object.values(
    filteredItems.reduce((acc, item) => {
      if (item.type !== "expense") {
        return acc;
      }

      if (!acc[item.category]) {
        acc[item.category] = {
          name: item.category,
          value: 0,
        };
      }

      acc[item.category].value +=
        item.amount;

      return acc;
    }, {} as any)
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          우리집 가계부
        </h1>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-xl ${
              view === "list"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            리스트
          </button>

          <button
            onClick={() =>
              setView("calendar")
            }
            className={`px-4 py-2 rounded-xl ${
              view === "calendar"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            달력
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-xl ${
              filter === "all"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            전체
          </button>

          <button
            onClick={() =>
              setFilter("fixed")
            }
            className={`px-3 py-2 rounded-xl ${
              filter === "fixed"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            고정지출
          </button>

          <button
            onClick={() =>
              setFilter("variable")
            }
            className={`px-3 py-2 rounded-xl ${
              filter === "variable"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            변동지출
          </button>
        </div>

        {/* 월 선택 */}
        <div className="bg-white rounded-2xl p-5 shadow mb-4">
          <p className="text-sm text-gray-500 mb-2">
            조회 월
          </p>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2"
          />
        </div>

        {/* 상단 */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* 잔액 */}
          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500 text-sm">
              현재 잔액
            </p>

            <h2 className="text-2xl font-bold mt-2">
              ₩{total.toLocaleString()}
            </h2>
          </div>

          {/* 차트 */}
          <div className="bg-white rounded-2xl p-5 shadow">
            <h3 className="font-semibold mb-4">
              카테고리별 지출
            </h3>

            <div className="h-52">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    label
                  >
                    {categoryData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            [
                              "#ef4444",
                              "#3b82f6",
                              "#22c55e",
                              "#f59e0b",
                              "#8b5cf6",
                            ][index % 5]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 입력 */}
        <div className="bg-white rounded-2xl p-5 shadow mb-4">
          <h3 className="font-semibold mb-4">
            내역 추가
          </h3>

          <div className="grid md:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="항목명"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="border rounded-xl px-3 py-2"
            />

            <input
              type="number"
              placeholder="금액"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="border rounded-xl px-3 py-2"
            />

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              className="border rounded-xl px-3 py-2"
            />

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
              className="border rounded-xl px-3 py-2"
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
                setCategory(
                  e.target.value
                )
              }
              className="border rounded-xl px-3 py-2"
            >
              <option>식비</option>
              <option>교통</option>
              <option>쇼핑</option>
              <option>월급</option>
              <option>기타</option>
            </select>

            <select
              value={spendType}
              onChange={(e) =>
                setSpendType(
                  e.target.value
                )
              }
              className="border rounded-xl px-3 py-2"
            >
              <option value="fixed">
                고정
              </option>

              <option value="variable">
                변동
              </option>
            </select>
          </div>

          <button
            onClick={addItem}
            className="w-full mt-4 bg-black text-white py-2 rounded-xl"
          >
            추가하기
          </button>
        </div>

        {/* 화면 */}
        {view === "list" ? (
          <ListView
            items={filteredItems}
            deleteItem={deleteItem}
          />
        ) : (
          <CalendarView
            items={filteredItems}
            selectedMonth={selectedMonth}
          />
        )}
      </div>
    </main>
  );
}