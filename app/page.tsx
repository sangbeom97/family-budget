  "use client";

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
import FridgeView from "@/components/FridgeView";

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
    useState("account");

  const [items, setItems] =
    useState<Item[]>([]);

  const [yearlyItems, setYearlyItems] =
  useState<Item[]>([]);

  const [categories, setCategories] =
  useState<Category[]>([]);

  const [view, setView] =
    useState("list");

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
  ).padStart(2,"0")}`;

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
  amount:Number(amount),
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
      "category"
    )
  }
  className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${
    mainTab ===
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
    setFilter("income")
  }
  className={`px-4 py-2 rounded-xl whitespace-nowrap ${
    filter === "income"
      ? "bg-black text-white"
      : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
  }`}
>
  수입
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

  if (view === "year") {
    date.setFullYear(
      date.getFullYear() - 1
    );

    setSelectedYear(
      date
        .getFullYear()
        .toString()
    );
  } else {
    date.setMonth(
      date.getMonth() - 1
    );
  }

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

  {view === "year" ? (
  <select
    value={selectedYear}
    onChange={(e) => {
  setSelectedYear(
    e.target.value
  );

  setSelectedMonth(
    `${e.target.value}-01`
  );
}}
    className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
  >
    {Array.from(
  { length: 31 },
  (_, i) =>
    new Date().getFullYear() - 15 + i
).map((year) => (
  <option
    key={year}
    value={year}
  >
    {year}년
  </option>
))}
  </select>
) : (
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
)}

  <button
    onClick={() => {
  const date = new Date(
    selectedMonth + "-01"
  );

  if (view === "year") {
    date.setFullYear(
      date.getFullYear() + 1
    );

    setSelectedYear(
      date
        .getFullYear()
        .toString()
    );
  } else {
    date.setMonth(
      date.getMonth() + 1
    );
  }

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

{(view === "list" ||
  view === "year") && (

  <div className="flex gap-2 mb-4">

    <input
      type="date"
      value={startDate}
      onChange={(e) =>
        setStartDate(
          e.target.value
        )
      }
      className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
    />

    <input
      type="date"
      value={endDate}
      onChange={(e) =>
        setEndDate(
          e.target.value
        )
      }
      className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2"
    />

    <button
      onClick={() => {
        setStartDate("");
        setEndDate("");
      }}
      className="px-3 py-2 rounded-xl bg-gray-200"
    >
      초기화
    </button>

  </div>
)}

            {(startDate || endDate) && (
  <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
    📅 기간조회 사용 중 (월 선택 무시)
  </div>
)}

<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

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
    className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2 w-full placeholder:text-gray-500"
  />

  {/* 카테고리 필터 */}
  <select
    value={categoryFilter}
    onChange={(e) =>
      setCategoryFilter(
        e.target.value
      )
    }
    className="border-2 border-gray-300 bg-white/95 text-black rounded-xl px-3 py-2 w-full"
  >
    <option value="all">
      전체 카테고리
    </option>

    {graphCategories
  .filter((category) => {

    if (filter === "saving") {
      return savingCategories.includes(
        category
      );
    }

    if (filter === "income") {
  return categories.some(
    (c) =>
      c.name === category &&
      c.type === "income"
  );
}

    if (filter === "all") {
      return true;
    }

    return categories.some(
      (c) =>
        c.name === category &&
        c.type === filter
    );
  })
  .map((category) => (
      <option
        key={category}
        value={category}
      >
        {category}
      </option>
    ))}
  </select>

  {/* 현재 합계 */}
  <div className="bg-white/95 border-2 border-gray-300 rounded-xl px-4 py-2 flex items-center justify-between">
    <span className="text-sm font-semibold text-gray-700">
      현재 합계
    </span>

    <span className="font-extrabold text-red-600">
      ₩
      {filteredTotal.toLocaleString()}
    </span>
  </div>

</div>



            {/* 카드 */}
            {view !== "calendar" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 수입
                </p>
                <h2 className="text-2xl font-extrabold text-blue-600">
                  ₩
                  {(
  view === "year"
    ? yearlyIncome
    : incomeTotal
).toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 지출
                </p>
                <h2 className="text-2xl font-extrabold text-red-700">
                  ₩
{(
  view === "year"
    ? yearlyExpense
    : expenseTotal
).toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  총 저축
                </p>
                <h2 className="text-2xl font-extrabold text-green-600">
                  ₩
{(
  view === "year"
    ? yearlySaving
    : savingTotal
).toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/95 p-5 rounded-2xl shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  실시간 잔액
                </p>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  ₩
                  {(
  view === "year"
    ? yearlyTotal
    : total
).toLocaleString()}
                </h2>
              </div>
              {view !== "year" && (
  <>
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
  </>
)}
            </div>
)}
            {/* 그래프 */}
            {view !== "calendar" &&
 filter !== "income" && (
            
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
  angle={-45}
  textAnchor="end"
  interval={0}
  height={90}
/>
                    <YAxis
                      domain={[
                        "auto",
                        "auto",
                      ]}
                    />
<Tooltip
  formatter={(value) => [
    `₩${Number(
      value
    ).toLocaleString()}`,
    " ",
  ]}
/>
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}

            {/* 예산 그래프 */}
            {view !== "year" && 
              view !== "calendar" &&
  filter !== "income" && (
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
                    <XAxis
  dataKey="name"
  angle={-45}
  textAnchor="end"
  interval={0}
  height={90}
/>
                    <YAxis
                      domain={[
                        "auto",
                        "auto",
                      ]}
                    />
<Tooltip
  formatter={(value) => [
    `₩${Number(
      value
    ).toLocaleString()}`,
    " ",
  ]}
/>

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

    <input
      type="file"
    accept=".xlsx,.xls,.csv"
    onChange={handleFileUpload}
    className="mb-4"
  />


              <div className="bg-white/95 p-5 rounded-2xl shadow-md mb-4">
              <div className="grid md:grid-cols-7 gap-3">
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
  type="text"
  placeholder="메모"
  value={memo}
  onChange={(e) =>
    setMemo(e.target.value)
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
                      setSpendType("");
                      const nextCategories =
  categories
    .filter(
      (item) =>
        item.type
  ?.trim()
  .toLowerCase() ===
(
  value === "income"
    ? "income"
    : spendType
)
    )
    .map(
      (item) => item.name
    );

setCategory(
  nextCategories[0] || ""
);
                    } else {
                      const nextCategories =
  categories
    .filter(
      (item) =>
        item.type
  ?.trim()
  .toLowerCase() ===
spendType
    )
    .map(
      (item) => item.name
    );

setCategory(
  nextCategories[0] || ""
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
                    onChange={(e) => {

  const value =
    e.target.value;

  setSpendType(value);

  const nextCategories =
    categories
      .filter(
        (item) =>
          item.type
  ?.trim()
  .toLowerCase() ===
value
      )
      .map(
        (item) => item.name
      );

  setCategory(
    nextCategories[0] || ""
  );
}}
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
<Tooltip
  formatter={(value) => [
    `₩${Number(
      value
    ).toLocaleString()}`,
    " ",
  ]}
/>

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
<Tooltip
  formatter={(value) => [
    `${Number(
      value
    ).toLocaleString()}%`,
    " ",
  ]}
/>

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
<Tooltip
  formatter={(value) => [
    `₩${Number(
      value
    ).toLocaleString()}`,
    " ",
  ]}
/>

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
  items={periodFilteredItems}
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
                items={filteredItems}
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
                  {graphCategories
                    .filter(
                      (category) =>
                        !savingCategories.includes(
                          category
                        )
                      )
  .map(
  (
    category
  ) => {

    const sourceItems =
  startDate || endDate
    ? periodFilteredItems
    : (
        view === "year"
          ? yearlyItems
          : items
      );

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

    const percent =
      budget > 0
        ? (spent / budget) * 100
        : 0;

    return (
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
{spent.toLocaleString()}
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
      percent > 100
        ? "bg-red-500"
        : "bg-blue-500"
    }`}
    style={{
      width: `${Math.min(
        percent,
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
  {Math.round(percent)}%
</span>
  </div>

</div>
                    );
                  }
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
        {mainTab ===
  "category" && (

  <div className="bg-white/95 p-5 rounded-2xl shadow-md">

    <h2 className="text-2xl font-extrabold mb-4">
      카테고리 관리
    </h2>

    <div className="grid md:grid-cols-3 gap-3 mb-4">

      <input
        type="text"
        placeholder="카테고리명"
        value={categoryName}
        onChange={(e) =>
          setCategoryName(
            e.target.value
          )
        }
        className="border-2 border-gray-300 rounded-xl px-3 py-2"
      />

      <select
        value={categoryType}
        onChange={(e) =>
          setCategoryType(
            e.target.value
          )
        }
        className="border-2 border-gray-300 rounded-xl px-3 py-2"
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

      <button
        onClick={addCategory}
        className="bg-black text-white rounded-xl px-4 py-2"
      >
        추가
      </button>
    </div>

    <div className="space-y-6">

  {/* 고정지출 */}
  <div>
    <h3 className="font-extrabold mb-2 text-blue-600">
      고정지출
    </h3>

    <div className="flex flex-wrap gap-2">
      {fixedCategories.map((item) => (
        <div
  key={item}
  className="bg-blue-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
>
  <span>{item}</span>

  <button
    onClick={async () => {

  const ok = confirm(
    `${item} 카테고리를 삭제할까요?`
  );

  if (!ok) return;

  await supabase
    .from("categories")
    .delete()
    .eq("name", item);

  fetchCategories();
}}
    className="text-red-500 text-xs"
  >
    ✕
  </button>
</div>
      ))}
    </div>
  </div>

  {/* 변동지출 */}
  <div>
    <h3 className="font-extrabold mb-2 text-red-600">
      변동지출
    </h3>

    <div className="flex flex-wrap gap-2">
      {variableCategories.map((item) => (
  <div
    key={item}
    className="bg-red-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
  >
    <span>{item}</span>

    <button
      onClick={async () => {

        const ok = confirm(
          `${item} 카테고리를 삭제할까요?`
        );

        if (!ok) return;

        await supabase
          .from("categories")
          .delete()
          .eq("name", item);

        fetchCategories();
      }}
      className="text-red-500 text-xs"
    >
      ✕
    </button>
  </div>
))}
    </div>
  </div>

  {/* 용돈 */}
  <div>
    <h3 className="font-extrabold mb-2 text-orange-600">
      용돈
    </h3>

    <div className="flex flex-wrap gap-2">
      {allowanceCategories.map((item) => (
  <div
    key={item}
    className="bg-orange-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
  >
    <span>{item}</span>

    <button
      onClick={async () => {

        const ok = confirm(
          `${item} 카테고리를 삭제할까요?`
        );

        if (!ok) return;

        await supabase
          .from("categories")
          .delete()
          .eq("name", item);

        fetchCategories();
      }}
      className="text-red-500 text-xs"
    >
      ✕
    </button>
  </div>
))}
    </div>
  </div>

  {/* 저축 */}
  <div>
    <h3 className="font-extrabold mb-2 text-green-600">
      저축
    </h3>

    <div className="flex flex-wrap gap-2">
      {savingCategories.map((item) => (
  <div
    key={item}
    className="bg-green-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
  >
    <span>{item}</span>

    <button
      onClick={async () => {

        const ok = confirm(
          `${item} 카테고리를 삭제할까요?`
        );

        if (!ok) return;

        await supabase
          .from("categories")
          .delete()
          .eq("name", item);

        fetchCategories();
      }}
      className="text-red-500 text-xs"
    >
      ✕
    </button>
  </div>
))}
    </div>
  </div>

  {/* 수입 */}
  <div>
    <h3 className="font-extrabold mb-2 text-purple-600">
      수입
    </h3>

    <div className="flex flex-wrap gap-2">
      {incomeCategories.map((item) => (
  <div
    key={item}
    className="bg-purple-100 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
  >
    <span>{item}</span>

    <button
      onClick={async () => {

        const ok = confirm(
          `${item} 카테고리를 삭제할까요?`
        );

        if (!ok) return;

        await supabase
          .from("categories")
          .delete()
          .eq("name", item);

        fetchCategories();
      }}
      className="text-red-500 text-xs"
    >
      ✕
    </button>
  </div>
))}
    </div>
  </div>

</div>

  </div>
)}
      </div>

      {duplicateItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-[450px]">

            <h2 className="text-xl font-bold mb-2">
              중복 가능 거래 발견
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              {duplicateIndex} / {duplicateTotal}
              (남은 확인 건수 :
              {duplicateTotal - duplicateIndex}
              건)
            </p>

            <div className="border rounded-xl p-3 mb-3">
              <p className="font-bold">
                추가하려는 데이터
              </p>

              <p>
                {duplicateItem.newItem.date}
              </p>

              <p>
                {duplicateItem.newItem.name}
              </p>

              <p>
                ₩
                {duplicateItem.newItem.amount.toLocaleString()}
              </p>
            </div>

            <div className="border rounded-xl p-3 mb-4">
              <p className="font-bold">
                이미 존재하는 데이터
              </p>

              <p>
                {duplicateItem.oldItem.date}
              </p>

              <p>
                {duplicateItem.oldItem.name}
              </p>

              <p>
                ₩
                {duplicateItem.oldItem.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => {

                  duplicateResolve?.(
                    true
                  );

                  setDuplicateItem(
                    null
                  );
                }}
                className="flex-1 bg-blue-500 text-white rounded-xl py-2"
              >
                예
              </button>

              <button
                onClick={() => {

                  duplicateResolve?.(
                    false
                  );

                  setDuplicateItem(
                    null
                  );
                }}
                className="flex-1 bg-gray-300 rounded-xl py-2"
              >
                아니요
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
      );
}
