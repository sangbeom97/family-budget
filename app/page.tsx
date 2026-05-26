"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";
import FridgeView from "@/components/FridgeView";

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
  const [mainTab, setMainTab] =
    useState("account");

  const [items, setItems] = useState<Item[]>([]);

  const [view, setView] =
    useState("list");

  const [filter, setFilter] =
    useState("all");

  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [type, setType] =
    useState("expense");

  const [editId, setEditId] =
    useState<number | null>(
      null
    );

  // 수입 카테고리
  const incomeCategories = [
    "급여",
    "상여",
    "수당",
    "기타수입",
  ];

  // 고정지출 카테고리
  const fixedCategories = [
    "주거비",
    "통신비",
    "보험료",
    "교통/차량(고정)",
    "헌금",
    "구독",
  ];

  // 변동지출 카테고리
  const variableCategories = [
    "식비(통상)",
    "식비(통상외)",
    "생활",
    "꾸밈비",
    "교통/차량(변동)",
    "의료",
    "건강",
    "문화/여가",
    "여행/숙박",
    "교육/학습",
    "경조/선물",
    "교회",
    "기타지출",
  ];

  // 용돈 카테고리
  const allowanceCategories = [
    "상범용돈",
    "희원용돈",
  ];

  // 저축 카테고리
  const savingCategories = [
    "예적금",
    "현금성통장",
    "투자",
    "연금저축",
    "주택청약",
  ];

  const [category, setCategory] =
    useState("식비(통상)");

  const [spendType, setSpendType] =
    useState("variable");

  // 현재 카테고리 자동 변경
  const currentCategories =
    type === "income"
      ? incomeCategories
      : spendType === "fixed"
      ? fixedCategories
      : spendType === "allowance"
      ? allowanceCategories
      : spendType === "saving"
      ? savingCategories
      : variableCategories;

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

  // 데이터 불러오기
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

    const { data, error } =
      await supabase
        .from("transactions")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", {
          ascending: false,
        });

    if (error) {
      console.log(error);
      return;
    }

    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, [selectedMonth]);

  // 카테고리 자동 변경
  useEffect(() => {
    setCategory(
      currentCategories[0]
    );

    if (type === "income") {
      setSpendType("income");
    }

    if (
      type === "expense" &&
      spendType === "income"
    ) {
      setSpendType("variable");
    }
  }, [spendType, type]);

  // 추가
  const addItem = async () => {
    if (
      name.trim() === "" ||
      amount.trim() === ""
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("transactions")
        .insert([
          {
            name,
            amount: Number(amount),
            type,
            category,
            spend_type:
              type === "income"
                ? "income"
                : spendType,
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

  // 수정 시작
  const startEdit = (
    item: Item
  ) => {
    setEditId(item.id);

    setName(item.name);

    setAmount(
      item.amount.toString()
    );

    setType(item.type);

    setCategory(item.category);

    setDate(item.date);

    setSpendType(
      item.spend_type
    );
  };

  // 수정 저장
  const updateItem = async () => {
    if (!editId) return;

    const { error } =
      await supabase
        .from("transactions")
        .update({
          name,
          amount: Number(amount),
          type,
          category,
          date,
          spend_type:
            type === "income"
              ? "income"
              : spendType,
        })
        .eq("id", editId);

    if (error) {
      console.log(error);
      return;
    }

    setEditId(null);

    setName("");
    setAmount("");

    fetchItems();
  };

  // 삭제
  const deleteItem = async (
    id: number
  ) => {
    const { error } =
      await supabase
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
            item.spend_type ===
            filter
        );

  // 총 수입
  const incomeTotal =
    filteredItems
      .filter(
        (item) =>
          item.type ===
          "income"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  // 총 지출
  const expenseTotal =
    filteredItems
      .filter(
        (item) =>
          item.type ===
            "expense" &&
          item.spend_type !==
            "saving"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  // 총 저축
  const savingTotal =
    filteredItems
      .filter(
        (item) =>
          item.spend_type ===
          "saving"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  // 실사용 잔액
  const total =
    incomeTotal -
    expenseTotal;

  // 차트 데이터
  const categoryData =
    Object.values(
      filteredItems.reduce(
        (acc, item) => {
          if (
            item.type !==
              "expense" ||
            item.spend_type ===
              "saving"
          ) {
            return acc;
          }

          if (
            !acc[item.category]
          ) {
            acc[item.category] =
              {
                name: item.category,
                value: 0,
              };
          }

          acc[item.category].value +=
            item.amount;

          return acc;
        },
        {} as any
      )
    );

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-black tracking-tight">
          무계획 속 계획
        </h1>

        {/* 메인 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() =>
              setMainTab(
                "account"
              )
            }
            className={`px-4 py-2 rounded-xl font-medium ${
              mainTab ===
              "account"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            가계부
          </button>

          <button
            onClick={() =>
              setMainTab(
                "fridge"
              )
            }
            className={`px-4 py-2 rounded-xl font-medium ${
              mainTab ===
              "fridge"
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            냉장고
          </button>
        </div>

        {mainTab ===
          "account" && (
          <>
            {/* 리스트/달력 탭 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() =>
                  setView(
                    "list"
                  )
                }
                className={`px-4 py-2 rounded-xl font-medium ${
                  view ===
                  "list"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                리스트
              </button>

              <button
                onClick={() =>
                  setView(
                    "calendar"
                  )
                }
                className={`px-4 py-2 rounded-xl font-medium ${
                  view ===
                  "calendar"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                달력
              </button>
            </div>

            {/* 필터 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                [
                  "all",
                  "전체",
                ],
                [
                  "income",
                  "수입",
                ],
                [
                  "fixed",
                  "고정지출",
                ],
                [
                  "variable",
                  "변동지출",
                ],
                [
                  "allowance",
                  "용돈",
                ],
                [
                  "saving",
                  "저축",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setFilter(
                        value
                      );

                      if (
                        value !==
                        "all"
                      ) {
                        setSpendType(
                          value
                        );
                      }
                    }}
                    className={`px-3 py-2 rounded-xl font-medium ${
                      filter ===
                      value
                        ? "bg-black text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {/* 월 선택 */}
            <div className="bg-white rounded-2xl p-5 shadow mb-4">
              <p className="text-sm text-gray-700 mb-2 font-medium">
                조회 월
              </p>

              <input
                type="month"
                value={
                  selectedMonth
                }
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
                className="border rounded-xl px-3 py-2 text-gray-800"
              />
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-sm text-gray-500">
                  총 수입
                </p>

                <h2 className="text-2xl font-bold text-blue-600 mt-2">
                  ₩
                  {incomeTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-sm text-gray-500">
                  총 지출
                </p>

                <h2 className="text-2xl font-bold text-red-500 mt-2">
                  ₩
                  {expenseTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-sm text-gray-500">
                  총 저축
                </p>

                <h2 className="text-2xl font-bold text-green-600 mt-2">
                  ₩
                  {savingTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-sm text-gray-500">
                  실사용 잔액
                </p>

                <h2 className="text-2xl font-bold mt-2">
                  ₩
                  {total.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* 차트 */}
            <div className="bg-white rounded-2xl p-5 shadow mb-4">
              <h3 className="font-semibold mb-4 text-gray-800">
                카테고리별 지출
              </h3>

              <div className="h-64 min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height={250}
                >
                  <BarChart
                    data={
                      categoryData
                    }
                  >
                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip />

                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 입력 */}
            <div className="bg-white rounded-2xl p-5 shadow mb-4">
              <h3 className="font-semibold mb-4 text-gray-800">
                {editId
                  ? "내역 수정"
                  : "내역 추가"}
              </h3>

              <div className="grid md:grid-cols-6 gap-3">
                <input
                  type="text"
                  placeholder="항목명"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
                />

                <input
                  type="number"
                  placeholder="금액"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
                />

                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
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
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
                >
                  {currentCategories.map(
                    (
                      item
                    ) => (
                      <option
                        key={
                          item
                        }
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    spendType
                  }
                  onChange={(e) =>
                    setSpendType(
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2 text-gray-800"
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

                  <option value="income">
                    수입
                  </option>
                </select>
              </div>

              <button
                onClick={
                  editId
                    ? updateItem
                    : addItem
                }
                className="w-full mt-4 bg-black text-white py-3 rounded-xl font-semibold"
              >
                {editId
                  ? "수정하기"
                  : "추가하기"}
              </button>
            </div>

            {/* 화면 */}
            {view ===
            "list" ? (
              <ListView
                items={
                  filteredItems
                }
                deleteItem={
                  deleteItem
                }
                startEdit={
                  startEdit
                }
              />
            ) : (
              <CalendarView
                items={
                  filteredItems
                }
                selectedMonth={
                  selectedMonth
                }
              />
            )}
          </>
        )}

        {mainTab ===
          "fridge" && (
          <FridgeView />
        )}
      </div>
    </main>
  );
}