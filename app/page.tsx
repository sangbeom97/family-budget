"use client";

import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

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
import CategoryChart from "@/components/CategoryChart";
import FridgeView from "@/components/FridgeView";
import SummaryCards from "@/components/SummaryCards";
import DuplicateModal from "@/components/DuplicateModal";
import CategoryManager from "@/components/CategoryManager";

import AccountView from "@/components/AccountView";

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

type Category = {
  id: number;
  name: string;
  type: string;
};

export default function Home() {
  const [mainTab, setMainTab] =
    useState<
      "account" |
      "category" |
      "fridge"
    >("account");

  const [items, setItems] =
    useState<Item[]>([]);

  const [yearlyItems, setYearlyItems] =
    useState<Item[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [view, setView] =
    useState<
      "list" |
      "year" |
      "budget" |
      "calendar"
    >("list");

  const [editingId, setEditingId] =
    useState<number | null>(
      null
    );

  const [name, setName] =
    useState("");

  const [memo, setMemo] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [type, setType] =
    useState("expense");

  const [category, setCategory] =
    useState("");

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

  const [selectedYear, setSelectedYear] =
    useState(
      new Date()
        .getFullYear()
        .toString()
    );

  const [darkMode, setDarkMode] =
    useState(false);

  const [selectedFileName, setSelectedFileName] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [budgets, setBudgets] =
    useState<Record<
      string,
      string
    >>({});

  const [categoryName, setCategoryName] =
    useState("");

  const [categoryType, setCategoryType] =
    useState("variable");

  const [duplicateItem, setDuplicateItem] =
    useState<any>(null);

  const [duplicateResolve, setDuplicateResolve] =
    useState<
      ((value: boolean) => void) | null
    >(null);

  const [duplicateIndex, setDuplicateIndex] =
    useState(0);

  const [duplicateTotal, setDuplicateTotal] =
    useState(0);

  const currentCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          (
            type === "income"
              ? "income"
              : spendType
          )
      )
      .map(
        (item) => item.name
      );

  const fixedCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          "fixed"
      )
      .map(
        (item) => item.name
      );



  const variableCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          "variable"
      )
      .map(
        (item) => item.name
      );

  const allowanceCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          "allowance"
      )
      .map(
        (item) => item.name
      );

  const savingCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          "saving"
      )
      .map(
        (item) => item.name
      );

  const incomeCategories =
    categories
      .filter(
        (item) =>
          item.type
            ?.trim()
            .toLowerCase() ===
          "income"
      )
      .map(
        (item) => item.name
      );

  const graphCategories =
    [
      ...new Set(
        categories
          .filter((item) => {

            if (filter === "all")
              return item.type !== "income";

            return (
              item.type === filter
            );
          })
          .map(
            (item) => item.name
          )
      ),
    ];

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

    const start =
      `${selectedMonth}-01`;

    const end =
      `${selectedMonth}-${String(
        endDate.getDate()
      ).padStart(2, "0")}`;

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

  // 연간 데이터 불러오기
  const fetchYearlyItems =
    async () => {

      const { data } =
        await supabase
          .from("transactions")
          .select("*")
          .gte(
            "date",
            `${selectedYear}-01-01`
          )
          .lte(
            "date",
            `${selectedYear}-12-31`
          );

      setYearlyItems(
        data || []
      );
    };


  const fetchCategories =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("categories")
        .select("*");

      console.log(
        "categories data",
        data
      );

      console.log(
        "categories error",
        error
      );

      setCategories(
        data || []
      );
      console.log(
        "updated categories",
        data
      );
    };

  const handleFileUpload = async (e: any) => {

    const file = e.target.files[0];

    if (!file) return;

    setSelectedFileName(file.name);

    const data =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(data);

    console.log(
      workbook.SheetNames
    );

    const sheet =
      workbook.Sheets[
      workbook.SheetNames[0]
      ];

    const json: any[] =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          header: 1,
          defval: "",
        }
      );

    console.log(json);

    console.log(
      "첫번째 row",
      json[1]
    );

    console.log(
      "실제 데이터 row",
      json.slice(0, 10)
    );

    console.log(
      "실제 데이터 전체",
      json[3].map(
        (v: any, i: number) =>
          `${i}: ${v}`
      )
    );

    const converted = json
      .slice(1)
      .filter((row: any) => {

        if (!row[0]) return false;
        if (!row[6]) return false;

        // 이체 제외
        if (
          String(row[2] || "")
            .includes("이체")
        ) {
          return false;
        }

        const amount =
          Number(
            String(row[6])
              .replaceAll(",", "")
              .replaceAll("₩", "")
          );

        if (isNaN(amount))
          return false;

        return true;
      })
      .map((row: any) => {

        const amount =
          Number(
            String(row[6])
              .replaceAll(",", "")
              .replaceAll("₩", "")
          );

        return {

          name: row[5] || "",

          memo: row[7] || "",

          amount:
            Math.abs(amount),

          type:
            amount < 0
              ? "expense"
              : "income",

          category:
            row[3] || "미분류",

          spend_type:
            row[2] === "저축/투자"
              ? "saving"
              : row[2] === "고정지출"
                ? "fixed"
                : row[2] === "용돈"
                  ? "allowance"
                  : "variable",

          date:
            XLSX.SSF.format(
              "yyyy-mm-dd",
              row[0]
            ),
        };
      });

    if (converted.length === 0) {

      alert(
        "업로드 가능한 데이터가 없습니다."
      );

      return;
    }

    let duplicateCount = 0;

    for (let i = 0; i < converted.length; i++) {

      const item = converted[i];

      const { data: exists } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("date", item.date)
          .eq("amount", item.amount)
          .limit(1);

      if (
        exists &&
        exists.length > 0
      ) {
        duplicateCount++;
      }
    }

    setDuplicateTotal(
      duplicateCount
    );

    let currentDuplicate = 0;

    for (const item of converted) {

      const { data: exists } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("date", item.date)
          .eq("amount", item.amount)
          .limit(1);

      if (
        exists &&
        exists.length > 0
      ) {

        currentDuplicate++;

        setDuplicateIndex(
          currentDuplicate
        );

        const result =
          await new Promise<boolean>(
            (resolve) => {

              setDuplicateItem({
                newItem: item,
                oldItem:
                  exists[0],
              });

              setDuplicateResolve(
                () => resolve
              );
            }
          );

        if (!result) {
          continue;
        }
      }

      await supabase
        .from("transactions")
        .insert(item);
    }

    alert("업로드 완료!");

    fetchItems();
    fetchYearlyItems();
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
    fetchYearlyItems();
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCategories();

    const timeout =
      setTimeout(() => {
        fetchCategories();
      }, 1000);

    return () =>
      clearTimeout(timeout);
  }, []);

  // 추가
  const addItem = async () => {
    if (!name || !amount)
      return;

    if (editingId) {
      await supabase
        .from("transactions")
        .update({
          name,
          memo,
          amount: Number(amount),
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
      setMemo("");
      setAmount("");
      setType("expense");

      setSpendType("variable");

      setDate(
        new Date()
          .toISOString()
          .split("T")[0]
      );

      setCategory(
        variableCategories[0] || ""
      );

      fetchItems();
      fetchYearlyItems();

      return;
    }

    await supabase
      .from("transactions")
      .insert([
        {
          name,
          memo,
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
    setMemo("");
    setAmount("");
    setType("expense");

    setSpendType("variable");

    setDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setCategory(
      variableCategories[0] || ""
    );

    fetchItems();
    fetchYearlyItems();
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
    fetchYearlyItems();
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

    setMemo(
      item.memo || ""
    );

    setSpendType(
      item.spend_type ||
      "variable"
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

  const addCategory =
    async () => {

      if (!categoryName)
        return;

      await supabase
        .from("categories")
        .insert([
          {
            name: categoryName,
            type: categoryType,
          },
        ]);

      setCategoryName("");

      fetchCategories();
    };

  const deleteCategory =
    async (name: string) => {

      await supabase
        .from("categories")
        .delete()
        .eq("name", name);

      fetchCategories();
    };

  const isRealExpense = (
    item: Item
  ) =>
    item.type ===
    "expense" &&
    item.spend_type !==
    "saving";

  const budgetCompareData =
    graphCategories
      .filter(
        (category) =>
          !savingCategories.includes(
            category
          )
      )
      .map(
        (category) => {
          const sourceItems =
            view === "year"
              ? yearlyItems
              : items;

          const spent =
            sourceItems
              .filter(
                (item) =>
                  item.category ===
                  category &&
                  isRealExpense(item)
              )
              .reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  (Number(item.amount) || 0),
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

  const baseItems =
    (startDate || endDate)
      ? yearlyItems
      : (
        view === "year"
          ? yearlyItems
          : items
      );

  const filteredItems =
    baseItems.filter((item) => {

      const filterMatch =
        filter === "all"
          ? true
          : filter === "income"
            ? item.type === "income"
            : item.type ===
            "expense" &&
            item.spend_type ===
            filter;

      const keyword =
        search
          .trim()
          .toLowerCase();

      const searchMatch =
        (item.name || "")
          .toLowerCase()
          .includes(keyword)
        ||
        (item.memo || "")
          .toLowerCase()
          .includes(keyword);

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

  const periodFilteredItems =
    filteredItems.filter((item) => {

      const startMatch =
        !startDate ||
        item.date >= startDate;

      const endMatch =
        !endDate ||
        item.date <= endDate;

      return (
        startMatch &&
        endMatch
      );
    });

  const yearlySourceItems =
    startDate || endDate
      ? periodFilteredItems
      : yearlyItems;

  const filteredTotal =
    filter === "income"
      ? periodFilteredItems
        .filter(
          (item) =>
            item.type === "income"
        )
        .reduce(
          (sum, item) =>
            sum +
            (Number(item.amount) || 0),
          0
        )
      : periodFilteredItems
        .filter(
          (item) =>
            isRealExpense(item)
        )
        .reduce(
          (sum, item) =>
            sum +
            (Number(item.amount) || 0),
          0
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
          sum +
          (Number(item.amount) || 0),
        0
      );

  const expenseTotal =
    items
      .filter(
        (item) =>
          isRealExpense(item)
      )
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.amount) || 0),
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
          sum +
          (Number(item.amount) || 0),
        0
      );

  const total =
    incomeTotal -
    expenseTotal;



  const getCategoryData = (
    sourceItems: Item[]
  ) => {

    return graphCategories
      .filter((category) => {

        if (filter === "saving") {
          return savingCategories.includes(
            category
          );
        }

        return !savingCategories.includes(
          category
        );
      })
      .map((category) => {

        const total =
          sourceItems
            .filter((item) => {

              if (item.category !== category)
                return false;

              if (filter === "saving") {
                return (
                  item.spend_type === "saving"
                );
              }

              return (
                isRealExpense(item) &&
                (
                  filter === "all"
                    ? true
                    : item.spend_type === filter
                )
              );
            })
            .reduce(
              (sum, item) =>
                sum +
                (Number(item.amount) || 0),
              0
            );

        return {
          name: category,
          value: total,
        };
      });
  };

  const yearlyCategoryData =
    getCategoryData(
      yearlySourceItems
    );

  const yearlyIncome =
    yearlySourceItems
      .filter(
        (item) =>
          item.type ===
          "income"
      )
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.amount) || 0),
        0
      );

  const yearlyExpense =
    yearlySourceItems
      .filter(
        (item) =>
          isRealExpense(item)
      )
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.amount) || 0),
        0
      );

  const yearlySaving =
    yearlySourceItems
      .filter(
        (item) =>
          item.spend_type ===
          "saving"
      )
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.amount) || 0),
        0
      );

  const yearlyTotal =
    yearlyIncome -
    yearlyExpense;



  // 차트 데이터
  const categoryData =
    getCategoryData(
      periodFilteredItems
    );



  const monthlyData = Array.from(
    { length: 12 },
    (_, i) => {

      const month = `${selectedYear}-${String(
        i + 1
      ).padStart(2, "0")}`;

      const yearlyCategoryData =
        getCategoryData(
          yearlySourceItems
        );

      const monthItems =
        yearlySourceItems.filter(
          (item) =>
            item.date &&
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
              (Number(item.amount) || 0),
            0
          );

      const expense =
        monthItems
          .filter(
            (item) =>
              isRealExpense(item)
          )
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              (Number(item.amount) || 0),
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
              (Number(item.amount) || 0),
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
    graphCategories
      .filter((category) => {

        if (filter === "saving") {
          return savingCategories.includes(
            category
          );
        }

        return !savingCategories.includes(
          category
        );
      })
      .map((category) => {
        const total =
          yearlySourceItems
            .filter(
              (item) =>
                item.category === category &&
                (
                  filter === "saving"
                    ? item.spend_type === "saving"
                    : isRealExpense(item)
                )
            )
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                (Number(item.amount) || 0),
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
      .filter(
        (item) => item.total > 0
      )
      .slice(0, 5);

  // 변동예산 총합
  const variableBudgetTotal =
    graphCategories
      .filter(
        (category) =>
          !savingCategories.includes(
            category
          )
      )
      .reduce(
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
    graphCategories
      .filter(
        (category) =>
          !savingCategories.includes(
            category
          )
      )
      .reduce(
        (sum, category) => {
          const sourceItems =
            view === "year"
              ? yearlyItems
              : items;

          const spent =
            sourceItems
              .filter(
                (item) =>
                  item.category ===
                  category &&
                  isRealExpense(item)
              )
              .reduce(
                (
                  acc,
                  item
                ) =>
                  acc +
                  (Number(item.amount) || 0),
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
    <main
      className={`min-h-screen p-4 md:p-6 ${darkMode
        ? "bg-slate-900 text-white"
        : "bg-zinc-200 text-black"
        }`}
    >
      <div className="max-w-6xl mx-auto">
        <h1
          className={`text-4xl font-extrabold mb-6 ${darkMode
            ? "text-white"
            : "text-black"
            }`}
        >
          무계획 속 계획
        </h1>
        <div className="mb-4">
          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            {darkMode
              ? "☀️ 라이트모드"
              : "🌙 다크모드"}
          </button>
        </div>

        {/* 메인탭 */}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() =>
              setMainTab(
                "category"
              )
            }
            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${mainTab ===
              "category"
              ? "bg-black text-white"
              : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
              }`}
          >
            카테고리관리
          </button>
          <button
            onClick={() =>
              setMainTab(
                "account"
              )
            }
            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${mainTab ===
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
            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${mainTab ===
              "fridge"
              ? "bg-black text-white"
              : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
              }`}
          >
            냉장고
          </button>
        </div>

        {mainTab === "account" && (
          <>
            <AccountView
              categoryData={categoryData}
              yearlyCategoryData={yearlyCategoryData}
              budgetCompareData={budgetCompareData}

              handleFileUpload={handleFileUpload}
              selectedFileName={selectedFileName}

              periodFilteredItems={periodFilteredItems}
              deleteItem={deleteItem}
              startEdit={startEdit}

              monthlyData={monthlyData}
              topCategories={topCategories}

              items={items}
              budgets={budgets}
              saveBudget={saveBudget}

              isRealExpense={isRealExpense}

              mainTab={mainTab}
              filter={filter}
              setFilter={setFilter}

              view={view}
              setView={setView}

              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}

              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}

              startDate={startDate}
              setStartDate={setStartDate}

              endDate={endDate}
              setEndDate={setEndDate}

              search={search}
              setSearch={setSearch}

              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}

              darkMode={darkMode}

              graphCategories={graphCategories}
              savingCategories={savingCategories}
              categories={categories}

              filteredTotal={filteredTotal}

              SummaryCards={SummaryCards}

              yearlyIncome={yearlyIncome}
              incomeTotal={incomeTotal}

              yearlyExpense={yearlyExpense}
              expenseTotal={expenseTotal}

              yearlySaving={yearlySaving}
              savingTotal={savingTotal}

              yearlyTotal={yearlyTotal}
              total={total}

                            variableBudgetTotal={variableBudgetTotal}
              remainVariableBudget={remainVariableBudget}

              name={name}
              setName={setName}

              memo={memo}
              setMemo={setMemo}

              amount={amount}
              setAmount={setAmount}

              date={date}
              setDate={setDate}

              type={type}
              setType={setType}

              category={category}
              setCategory={setCategory}

              spendType={spendType}
              setSpendType={setSpendType}

              currentCategories={currentCategories}

              addItem={addItem}

              editingId={editingId}
            />
          </>
        )}

        {mainTab === "category" && (
          <CategoryManager
            darkMode={darkMode}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            categoryType={categoryType}
            setCategoryType={setCategoryType}
            addCategory={addCategory}
            fixedCategories={fixedCategories}
            variableCategories={variableCategories}
            allowanceCategories={allowanceCategories}
            savingCategories={savingCategories}
            incomeCategories={incomeCategories}
            fetchCategories={fetchCategories}
            deleteCategory={deleteCategory}
          />
        )}

        {mainTab === "fridge" && (
          <FridgeView />
        )}

      </div>

      <DuplicateModal
        darkMode={darkMode}
        duplicateItem={duplicateItem}
        duplicateIndex={duplicateIndex}
        duplicateTotal={duplicateTotal}
        duplicateResolve={
          duplicateResolve
        }
        setDuplicateItem={
          setDuplicateItem
        }
      />
    </main >
  );
}