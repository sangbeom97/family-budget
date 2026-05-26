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

  const [items, setItems] =
    useState<Item[]>([]);

  const [view, setView] =
    useState("list");

  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [type, setType] =
    useState("expense");

  const [category, setCategory] =
    useState("식비(통상)");

  const [spendType, setSpendType] =
    useState("variable");

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [budgets, setBudgets] =
    useState<Record<
      string,
      string
    >>({});

  // 카테고리
  const incomeCategories = [
    "급여",
    "상여",
    "수당",
    "기타수입",
  ];

  const fixedCategories = [
    "주거비",
    "통신비",
    "보험료",
    "교통/차량(고정)",
    "헌금",
    "구독",
  ];

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

  const allowanceCategories = [
    "상범용돈",
    "희원용돈",
  ];

  const savingCategories = [
    "예적금",
    "현금성통장",
    "투자",
    "연금저축",
    "주택청약",
  ];

  const currentCategories =
    type === "income"
      ? incomeCategories
      : spendType === "fixed"
      ? fixedCategories
      : spendType ===
        "allowance"
      ? allowanceCategories
      : spendType ===
        "saving"
      ? savingCategories
      : variableCategories;

  // 거래내역 불러오기
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

    const { data } =
      await supabase
        .from("transactions")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", {
          ascending: false,
        });

    setItems(data || []);
  };

  // 예산 불러오기
  const fetchBudgets =
    async () => {
      const { data } =
        await supabase
          .from("budgets")
          .select("*")
          .eq(
            "month",
            selectedMonth
          );

      const budgetMap:
        Record<
          string,
          string
        > = {};

      data?.forEach(
        (item: any) => {
          budgetMap[
            item.category
          ] =
            item.amount.toString();
        }
      );

      setBudgets(
        budgetMap
      );
    };

  useEffect(() => {
    fetchItems();
    fetchBudgets();
  }, [selectedMonth]);

  // 추가
  const addItem = async () => {
    if (!name || !amount)
      return;

    await supabase
      .from("transactions")
      .insert([
        {
          name,
          amount:
            Number(amount),
          type,
          category,
          spend_type:
            type === "income"
              ? "income"
              : spendType,
          date,
        },
      ]);

    setName("");
    setAmount("");

    fetchItems();
  };

  // 예산 저장
  const saveBudget =
    async (
      category: string,
      value: string
    ) => {
      setBudgets({
        ...budgets,
        [category]: value,
      });

      const { data } =
        await supabase
          .from("budgets")
          .select("*")
          .eq(
            "category",
            category
          )
          .eq(
            "month",
            selectedMonth
          )
          .maybeSingle();

      if (data) {
        await supabase
          .from("budgets")
          .update({
            amount:
              Number(value),
          })
          .eq("id", data.id);
      } else {
        await supabase
          .from("budgets")
          .insert([
            {
              category,
              amount:
                Number(value),
              month:
                selectedMonth,
            },
          ]);
      }
    };

  // 차트 데이터
  const categoryData =
    variableCategories.map(
      (category) => {
        const total =
          items
            .filter(
              (item) =>
                item.category ===
                  category &&
                item.type ===
                  "expense" &&
                item.spend_type !==
                  "saving"
            )
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                item.amount,
              0
            );

        return {
          name: category,
          value: total,
        };
      }
    );

  const budgetCompareData =
    variableCategories.map(
      (category) => {
        const spent =
          items
            .filter(
             (item) =>
                item.category ===
                  category &&
                item.type ===
                 "expense"
            )
           .reduce(
             (
                sum,
               item
              ) =>
                sum +
                item.amount,
             0
           );

        const budget =
         Number(
           budgets[
              category
           ] || 0
         );

      return {
        name: category,

        사용금액: spent,

        // 음수 허용
        남은예산:
          budget - spent,
      };
    }
  );

  const incomeTotal =
    items
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

  const expenseTotal =
    items
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

  const savingTotal =
    items
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

  const total =
    incomeTotal -
    expenseTotal;
    // 변동예산 총합
const variableBudgetTotal =
  variableCategories.reduce(
    (sum, category) =>
      sum +
      Number(
        budgets[
          category
        ] || 0
      ),
    0
  );

// 남은 변동예산
const remainVariableBudget =
  variableCategories.reduce(
    (sum, category) => {
      const spent =
        items
          .filter(
            (item) =>
              item.category ===
                category &&
              item.type ===
                "expense"
          )
          .reduce(
            (
              acc,
              item
            ) =>
              acc +
              item.amount,
            0
          );

      const budget =
        Number(
          budgets[
            category
          ] || 0
        );

      return (
        sum +
        (budget - spent)
      );
    },
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-black">
          무계획 속 계획
        </h1>

        {/* 메인탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() =>
              setMainTab(
                "account"
              )
            }
            className={`px-4 py-2 rounded-xl ${
              mainTab ===
              "account"
                ? "bg-black text-white"
                : "bg-white"
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
            className={`px-4 py-2 rounded-xl ${
              mainTab ===
              "fridge"
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            냉장고
          </button>
        </div>

        {mainTab ===
          "account" && (
          <>
            {/* 탭 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() =>
                  setView(
                    "list"
                  )
                }
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
                  setView(
                    "calendar"
                  )
                }
                className={`px-4 py-2 rounded-xl ${
                  view ===
                  "calendar"
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                달력
              </button>

              <button
                onClick={() =>
                  setView(
                    "budget"
                  )
                }
                className={`px-4 py-2 rounded-xl ${
                  view ===
                  "budget"
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                예산
              </button>
            </div>

            {/* 월 */}
            <div className="bg-white p-5 rounded-2xl shadow mb-4">
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
                className="border rounded-xl px-3 py-2"
              />
            </div>

            {/* 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white p-5 rounded-2xl shadow">
                총 수입
                <h2 className="text-2xl font-bold text-blue-600">
                  ₩
                  {incomeTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow">
                총 지출
                <h2 className="text-2xl font-bold text-red-500">
                  ₩
                  {expenseTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow">
                총 저축
                <h2 className="text-2xl font-bold text-green-600">
                  ₩
                  {savingTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow">
                실사용 잔액
                <h2 className="text-2xl font-bold">
                  ₩
                  {total.toLocaleString()}
                </h2>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow">
                <p className="text-sm text-gray-500">
                  변동예산
                </p>

                <h2 className="text-2xl font-bold text-purple-600 mt-2">
                  ₩
    {variableBudgetTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow">
                <p className="text-sm text-gray-500">
                  남은 변동예산
                </p>

                <h2 className="text-2xl font-bold text-orange-500 mt-2">
                  ₩
                  {remainVariableBudget.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* 그래프 */}
            <div className="bg-white rounded-2xl p-5 shadow mb-4">
              <h3 className="font-bold mb-4">
                카테고리별 지출
              </h3>

              <div className="h-72">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      categoryData
                    }
                  >
                    <XAxis dataKey="name" />
                    <YAxis
                      domain={[
                        "auto",
                        "auto",
                      ]}
                    />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 예산 그래프 */}
            <div className="bg-white rounded-2xl p-5 shadow mb-4">
              <h3 className="font-bold mb-4">
                예산 대비 사용 현황
              </h3>

              <div className="h-72">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      budgetCompareData
                    }
                  >
                    <XAxis dataKey="name" />
                    <YAxis
                      domain={[
                        "auto",
                        "auto",
                      ]}
                    />
                    <Tooltip />

                    <Bar dataKey="남은예산" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 입력 */}
            <div className="bg-white p-5 rounded-2xl shadow mb-4">
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
                  className="border rounded-xl px-3 py-2"
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
                  className="border rounded-xl px-3 py-2"
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
                  className="border rounded-xl px-3 py-2"
                />

                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target
                        .value
                    )
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
                      e.target
                        .value
                    )
                  }
                  className="border rounded-xl px-3 py-2"
                >
                  {currentCategories.map(
                    (item) => (
                      <option
                        key={item}
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
                  className="border rounded-xl px-3 py-2"
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
              </div>

              <button
                onClick={addItem}
                className="w-full bg-black text-white rounded-xl py-3 mt-4"
              >
                추가하기
              </button>
            </div>

            {/* 화면 */}
            {view === "list" ? (
              <ListView
                items={items}
                deleteItem={() => {}}
                startEdit={() => {}}
              />
            ) : view ===
              "calendar" ? (
              <CalendarView
                items={items}
                selectedMonth={
                  selectedMonth
                }
              />
            ) : (
              <div className="bg-white p-5 rounded-2xl shadow">
                <h3 className="font-bold mb-4">
                  카테고리별 예산
                </h3>

                <div className="space-y-3">
                  {variableCategories.map(
                    (
                      category
                    ) => (
                      <div
                        key={
                          category
                        }
                        className="flex gap-3 items-center"
                      >
                        <div className="w-40">
                          {
                            category
                          }
                        </div>

                        <input
                          type="number"
                          value={
                            budgets[
                              category
                            ] || ""
                          }
                          onChange={(e) =>
                            saveBudget(
                              category,
                              e.target.value
                            )
                          }
                          className="flex-1 border rounded-xl px-3 py-2"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
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