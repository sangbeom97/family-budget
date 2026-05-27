  "use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  BarChart,
  Bar,
  Cell,
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

  const [editingId, setEditingId] =
    useState<number | null>(
     null
   );

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

  const [filter, setFilter] =
  useState("all");

  const [search, setSearch] =
  useState("");

  const [categoryFilter, setCategoryFilter] =
  useState("all");

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

    if (editingId) {
      await supabase
        .from("transactions")
        .update({
          name,
          amount:
            Number(amount),
          type,
          category,
          spend_type:
            type === "income"
              ? null
              : spendType,
          date,
        })
        .eq("id", editingId);

      setEditingId(null);

      setName("");
      setAmount("");

      fetchItems();

      return;
    }

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
              ? null
              : spendType,
          date,
        },
      ]);
    setName("");
    setAmount("");

    fetchItems();
   };

  // 삭제
  const deleteItem = async (
    id: number
  ) => {
    await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    fetchItems();
  };

  const startEdit = (
    item: Item
  ) => {
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

    setEditingId(item.id);
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

  const filteredItems =
  items.filter((item) => {

    const filterMatch =
      filter === "all"
        ? true
        : item.spend_type ===
          filter;

    const searchMatch =
      item.name.includes(
        search
      );

    const categoryMatch =
      categoryFilter ===
      "all"
        ? true
        : item.category ===
          categoryFilter;

    return (
      filterMatch &&
      searchMatch &&
      categoryMatch
    );
  });

  

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

// 연요약용
const selectedYear =
  selectedMonth.split(
    "-"
  )[0];

const yearlyItems =
  items.filter(
    const yearlyCategoryData =
  variableCategories.map(
    (category) => {

      const total =
        yearlyItems
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
    (item) =>
      item.date.startsWith(
        selectedYear
      )
  );

const yearlyIncome =
  yearlyItems
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

  const yearlyExpense =
  yearlyItems
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
  // 차트 데이터
  const categoryData =
    variableCategories.map(
      (category) => {
        const total =
          (
            view === "year"
              ? yearlyItems
               : items
          )
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

const monthlyData = Array.from(
  { length: 12 },
  (_, i) => {

    const month = `${selectedYear}-${String(
      i + 1
    ).padStart(2, "0")}`;

    const monthItems =
      yearlyItems.filter(
        (item) =>
          item.date.startsWith(
            month
          )
      );

    const income =
      monthItems
        .filter(
          (item) =>
            item.type ===
            "income"
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

    const expense =
      monthItems
        .filter(
          (item) =>
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

    const saving =
      monthItems
        .filter(
          (item) =>
            item.spend_type ===
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
      month: `${i + 1}월`,
      수입: income,
      지출: expense,
      저축: saving,

      저축률:
        income > 0
          ? Math.round(
              (saving /
                income) *
                100
            )
          : 0,
    };
  }
);

// 연간 TOP5
const topCategories =
  variableCategories
    .map((category) => {
      const total =
        yearlyItems
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

      return {
        category,
        total,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total
    )
    .slice(0, 5);
  
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
    <main className="min-h-screen bg-zinc-200 p-4 md:p-6">
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
            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
              mainTab ===
              "account"
                ? "bg-black text-white"
                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
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
            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
              mainTab ===
              "fridge"
                ? "bg-black text-white"
                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
            }`}
          >
            냉장고
          </button>
        </div>

        {mainTab ===
          "account" && (
          <>
            {/* 탭 */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() =>
                  setFilter("all")
                }
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  filter === "all"
                    ? "bg-black text-white"
                    : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                }`}
              >
                전체
              </button>

              <button
                onClick={() =>
                  setFilter(
                    "fixed"
                  )
                }
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  filter === "fixed"
                    ? "bg-black text-white"
                    : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                }`}
              >
                고정지출
              </button>

              <button
                onClick={() =>
                  setFilter(
                    "variable"
                  )
                }
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  filter ===
                  "variable"
                    ? "bg-black text-white"
                    : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                }`}
              >
                변동지출
              </button>

              <button
                onClick={() =>
                  setFilter(
                    "allowance"
                  )
                }
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  filter ===
                  "allowance"
                    ? "bg-black text-white"
                    : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                }`}
              >
                용돈
              </button>

              <button
                onClick={() =>
                  setFilter(
                    "saving"
                  )
                }
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  filter ===
                  "saving"
                    ? "bg-black text-white"
                    : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                }`}
             >
               저축
              </button>
            </div>
            <div className="flex gap-2 mb-4">

  <button
    onClick={() =>
      setView("year")
    }
    className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
      view === "year"
        ? "bg-black text-white"
        : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
    }`}
  >
    연요약
  </button>

  <button
    onClick={() =>
      setView("budget")
    }
    className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
      view === "budget"
        ? "bg-black text-white"
        : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
    }`}
  >
    예산
  </button>

  <button
    onClick={() =>
      setView("list")
    }
    className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
      view === "list"
        ? "bg-black text-white"
        : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
    }`}
  >
    리스트
  </button>

  <button
    onClick={() =>
      setView("calendar")
    }
    className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
      view === "calendar"
        ? "bg-black text-white"
        : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
    }`}
  >
    달력
  </button>

</div>

            <div className="flex items-center gap-2 mb-4">

  <button
    onClick={() => {
      const date = new Date(
        selectedMonth + "-01"
      );

      date.setMonth(
        date.getMonth() - 1
      );

      setSelectedMonth(
        date
          .toISOString()
          .slice(0, 7)
      );
    }}
    className="bg-white/95 px-3 py-2 rounded-xl shadow-md"
  >
    ◀
  </button>

  <input
    type="month"
    value={selectedMonth}
    onChange={(e) =>
      setSelectedMonth(
        e.target.value
      )
    }
    className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
  />

  <button
    onClick={() => {
      const date = new Date(
        selectedMonth + "-01"
      );

      date.setMonth(
        date.getMonth() + 1
      );

      setSelectedMonth(
        date
          .toISOString()
          .slice(0, 7)
      );
    }}
    className="bg-white/95 px-3 py-2 rounded-xl shadow-md"
  >
    ▶
  </button>

</div>



{/* 검색 */}
<input
  type="text"
  placeholder="검색"
  value={search}
  onChange={(e) =>
    setSearch(
      e.target.value
    )
  }
  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2 mb-4 w-full placeholder:text-gray-500"
/>

{/* 카테고리 필터 */}
<select
  value={categoryFilter}
  onChange={(e) =>
    setCategoryFilter(
      e.target.value
    )
  }
  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2 mb-4 w-full placeholder:text-gray-500"
>
  <option value="all">
    전체 카테고리
  </option>

  {[
    ...fixedCategories,
    ...variableCategories,
    ...savingCategories,
  ].map((category) => (
    <option
      key={category}
      value={category}
    >
      {category}
    </option>
  ))}
</select>



            {/* 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 수입
                </p>
                <h2 className="text-2xl font-extrabold text-blue-600">
                  ₩
                  {incomeTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 지출
                </p>
                <h2 className="text-2xl font-extrabold text-red-700">
                  ₩
                  {expenseTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 저축
                </p>
                <h2 className="text-2xl font-extrabold text-green-600">
                  ₩
                  {savingTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  실시간 잔액
                </p>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  ₩
                  {total.toLocaleString()}
                </h2>
              </div>
              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-900">
                  변동예산
                </p>

                <h2 className="text-2xl font-extrabold text-purple-600 mt-2">
                  ₩
    {variableBudgetTotal.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-900">
                  남은 변동예산
                </p>

                <h2 className="text-2xl font-extrabold text-orange-700 mt-2">
                  ₩
                  {remainVariableBudget.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* 그래프 */}
            <div className="bg-white/95 rounded-2xl p-5 shadow-md mb-4">
              <h3 className="font-extrabold mb-4">
                카테고리별 지출
              </h3>

              <div className="h-72">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      view === "year"
                        ? yearlyCategoryData
                        : categoryData
                    }
                  >
                    <XAxis
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
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
            {view !== "year" && (
            <div className="bg-white/95 rounded-2xl p-5 shadow-md mb-4">
              <h3 className="font-extrabold mb-4">
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

                    <Bar dataKey="남은예산">
                      {budgetCompareData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.남은예산 >= 0
                                ? "#2563eb"
                                : "#ef4444"
                            }
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}
            {view === "list" && (
              <div className="sticky top-2 z-50 bg-gray-100/90 backdrop-blur pb-3">
              <div className="bg-white/95 p-5 rounded-2xl shadow-md mb-4">
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
                  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
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
                  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
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
                  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
                />

                <select
                  value={type}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setType(value);

                    if (
                      value === "income"
                    ) {
                      setCategory("급여");
                    } else {
                      setCategory(
                        "식비(통상)"
                      );
                    }
                  }}
                  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
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
                  className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
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


                {type === "expense" && (
                  <select
                    value={spendType}
                    onChange={(e) =>
                      setSpendType(
                        e.target.value
                      )
                    }
                    className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
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
              </div>
              )}

              {/* 화면 */}
              {view === "year" ? (

                <div className="space-y-4">



                {/* 월별 지출 */}
  <div className="bg-white/95 p-5 rounded-2xl shadow-md">
    <h3 className="font-extrabold mb-4">
      월별 지출
    </h3>

    <div className="h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={monthlyData}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="지출"
            fill="#ef4444"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* 월별 저축률 */}
  <div className="bg-white/95 p-5 rounded-2xl shadow-md">
    <h3 className="font-extrabold mb-4">
      월별 저축률
    </h3>

    <div className="h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={monthlyData}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="저축률"
            fill="#22c55e"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* 월별 소비패턴 */}
  <div className="bg-white/95 p-5 rounded-2xl shadow-md">
    <h3 className="font-extrabold mb-4">
      월별 소비패턴
    </h3>

    <div className="h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={monthlyData}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="수입"
            fill="#2563eb"
          />

          <Bar
            dataKey="지출"
            fill="#ef4444"
          />

          <Bar
            dataKey="저축"
            fill="#22c55e"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* TOP5 */}
  <div className="bg-white/95 p-5 rounded-2xl shadow-md">
    <h3 className="font-extrabold mb-4">
      연간 카테고리 TOP5
    </h3>

    <div className="space-y-3">
      {topCategories.map(
        (item, index) => (
          <div
            key={item.category}
            className="flex justify-between border-b pb-2"
          >
            <span>
              {index + 1}.{" "}
              {item.category}
            </span>

            <span className="font-extrabold">
              ₩
              {item.total.toLocaleString()}
            </span>
          </div>
        )
      )}
    </div>
  </div>
      </div>






            
            
            ) : view === "list" ? (
              <ListView
                items={filteredItems}
                deleteItem={
                  deleteItem
                }
                startEdit={
                  startEdit
                }
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
              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <h3 className="font-extrabold mb-4">
                  카테고리별 예산
                </h3>

                <div className="space-y-3">
                  {variableCategories.map(
                    (
                      category
                    ) => (
                      <div
  key={category}
  className="bg-gray-50 rounded-xl p-3"
>

  <div className="flex justify-between mb-2">
    <span className="font-semibold text-gray-800">
      {category}
    </span>

    <span className="font-extrabold">
      ₩
      {(
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
          )
      ).toLocaleString()}
      {" / "}
      ₩
      {Number(
        budgets[
          category
        ] || 0
      ).toLocaleString()}
    </span>
  </div>

  {/* Progress */}
  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
    <div
      className={`h-3 rounded-full ${
        (
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
            ) /
          Number(
            budgets[
              category
            ] || 1
          )
        ) > 1
          ? "bg-red-500"
          : "bg-blue-500"
      }`}
      style={{
        width: `${Math.min(
          (
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
              ) /
            Number(
              budgets[
                category
              ] || 1
            )
          ) * 100,
          100
        )}%`,
      }}
    />
  </div>

  <div className="flex justify-between mt-2">
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
      className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2 w-32 placeholder:text-gray-500"
    />

    <span className="text-sm font-semibold text-gray-800">
      {Math.round(
        (
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
            ) /
          Number(
            budgets[
              category
            ] || 1
          )
        ) * 100
      )}
      %
    </span>
  </div>

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
