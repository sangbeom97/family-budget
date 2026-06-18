"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// 컴포넌트 임포트 생략...
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
  // --- 1. 상태 정의 (기존 유지) ---
  const [mainTab, setMainTab] = useState<"account" | "category" | "fridge">("account");
  const [items, setItems] = useState<Item[]>([]);
  const [yearlyItems, setYearlyItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<"list" | "year" | "budget" | "calendar">("list");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [spendType, setSpendType] = useState("variable");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [darkMode, setDarkMode] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("variable");

  // 중복 데이터 처리 모달 관련 상태
  const [duplicateItem, setDuplicateItem] = useState<any>(null);
  const [duplicateResolve, setDuplicateResolve] = useState<((value: boolean) => void) | null>(null);
  const [duplicateIndex, setDuplicateIndex] = useState(0);
  const [duplicateTotal, setDuplicateTotal] = useState(0);

  // --- 2. 데이터 Fetch 함수 (기존 로직 유지하되 안전성 확보) ---
  const fetchItems = async () => {
    const startDateObj = new Date(`${selectedMonth}-01`);
    const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0);

    const start = `${selectedMonth}-01`;
    const end = `${selectedMonth}-${String(endDateObj.getDate()).padStart(2, "0")}`;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    setItems(data || []);
  };

  const fetchYearlyItems = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`);

    setYearlyItems(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const fetchBudgets = async () => {
    const { data } = await supabase.from("budgets").select("*").eq("month", selectedMonth);
    const budgetMap: Record<string, string> = {};
    data?.forEach((item: any) => {
      budgetMap[item.category] = item.amount.toString();
    });
    setBudgets(budgetMap);
  };

  // --- 3. useEffect 최적화 (1초 뒤 중복 호출 제거) ---
  useEffect(() => {
    fetchItems();
    fetchYearlyItems();
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 4. useMemo를 통한 연산 최적화 (★가장 중요) ---
  
  // 타입별 카테고리 분류 메모이제이션
  const categorizedNames = useMemo(() => {
    const filterBy = (t: string) => 
      categories.filter((c) => c.type?.trim().toLowerCase() === t).map((c) => c.name);

    return {
      fixed: filterBy("fixed"),
      variable: filterBy("variable"),
      allowance: filterBy("allowance"),
      saving: filterBy("saving"),
      income: filterBy("income"),
      current: categories
        .filter((c) => c.type?.trim().toLowerCase() === (type === "income" ? "income" : spendType))
        .map((c) => c.name),
    };
  }, [categories, type, spendType]);

  const graphCategories = useMemo(() => {
    return [
      ...new Set(
        categories
          .filter((item) => filter === "all" ? item.type !== "income" : item.type === filter)
          .map((item) => item.name)
      ),
    ];
  }, [categories, filter]);

  const isRealExpense = (item: Item) => item.type === "expense" && item.spend_type !== "saving";

  // 필터링된 아이템 메모이제이션 (검색어 입력 시 딜레이 방지)
  const periodFilteredItems = useMemo(() => {
    const baseItems = (startDate || endDate) ? yearlyItems : (view === "year" ? yearlyItems : items);
    const keyword = search.trim().toLowerCase();

    return baseItems.filter((item) => {
      const filterMatch = filter === "all" 
        ? true 
        : filter === "income" 
          ? item.type === "income" 
          : item.type === "expense" && item.spend_type === filter;

      const searchMatch = (item.name || "").toLowerCase().includes(keyword) ||
                          (item.memo || "").toLowerCase().includes(keyword);

      const categoryMatch = categoryFilter === "all" ? true : item.category === categoryFilter;
      const startMatch = !startDate || item.date >= startDate;
      const endMatch = !endDate || item.date <= endDate;

      return filterMatch && searchMatch && categoryMatch && startMatch && endMatch;
    });
  }, [items, yearlyItems, view, filter, search, categoryFilter, startDate, endDate]);

  const yearlySourceItems = useMemo(() => {
    return (startDate || endDate) ? periodFilteredItems : yearlyItems;
  }, [startDate, endDate, periodFilteredItems, yearlyItems]);

  // 공통 카테고리 데이터 계산 헬퍼 로직을 useMemo 내부로 흡수
  const getCategoryData = (sourceList: Item[]) => {
    return graphCategories
      .filter((cat) => filter === "saving" ? categorizedNames.saving.includes(cat) : !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const totalAmount = sourceList
          .filter((item) => {
            if (item.category !== cat) return false;
            if (filter === "saving") return item.spend_type === "saving";
            return isRealExpense(item) && (filter === "all" ? true : item.spend_type === filter);
          })
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return { name: cat, value: totalAmount };
      });
  };

  const categoryData = useMemo(() => getCategoryData(periodFilteredItems), [graphCategories, filter, categorizedNames.saving, periodFilteredItems]);
  const yearlyCategoryData = useMemo(() => getCategoryData(yearlySourceItems), [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);

  // 수입/지출/저축 총합 계산 최적화
  const totals = useMemo(() => {
    const inc = items.filter((i) => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const exp = items.filter(isRealExpense).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const sav = items.filter((i) => i.spend_type === "saving").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    
    const yInc = yearlySourceItems.filter((i) => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const yExp = yearlySourceItems.filter(isRealExpense).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const ySav = yearlySourceItems.filter((i) => i.spend_type === "saving").reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const filtTot = filter === "income"
      ? periodFilteredItems.filter((i) => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0)
      : periodFilteredItems.filter(isRealExpense).reduce((s, i) => s + (Number(i.amount) || 0), 0);

    return {
      incomeTotal: inc, expenseTotal: exp, savingTotal: sav, total: inc - exp,
      yearlyIncome: yInc, yearlyExpense: yExp, yearlySaving: ySav, yearlyTotal: yInc - yExp,
      filteredTotal: filtTot
    };
  }, [items, yearlySourceItems, periodFilteredItems, filter]);

  // 예산 비교 및 변동 예산 데이터 매핑
  const budgetCompareData = useMemo(() => {
    const sourceItems = view === "year" ? yearlyItems : items;
    return graphCategories
      .filter((cat) => !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const spent = sourceItems
          .filter((i) => i.category === cat && isRealExpense(i))
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const budget = Number(budgets[cat] || 0);
        return { name: cat, 사용금액: spent, 남은예산: budget - spent };
      });
  }, [graphCategories, categorizedNames.saving, view, yearlyItems, items, budgets]);

  const { variableBudgetTotal, remainVariableBudget } = useMemo(() => {
    const sourceItems = view === "year" ? yearlyItems : items;
    const targets = graphCategories.filter((cat) => !categorizedNames.saving.includes(cat));
    
    const vBudgetTot = targets.reduce((s, cat) => s + Number(budgets[cat] || 0), 0);
    const rVariableBudget = targets.reduce((sum, cat) => {
      const spent = sourceItems.filter((i) => i.category === cat && isRealExpense(i)).reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const budget = Number(budgets[cat] || 0);
      return sum + (budget - spent);
    }, 0);

    return { variableBudgetTotal: vBudgetTot, remainVariableBudget: rVariableBudget };
  }, [graphCategories, categorizedNames.saving, view, yearlyItems, items, budgets]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const monthItems = yearlySourceItems.filter((item) => item.date && item.date.startsWith(month));

      const income = monthItems.filter((i) => i.type === "income").reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const expense = monthItems.filter(isRealExpense).reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const saving = monthItems.filter((i) => i.spend_type === "saving").reduce((s, i) => s + (Number(i.amount) || 0), 0);

      return {
        month: `${i + 1}월`,
        수입: income,
        지출: expense,
        저축: saving,
        저축률: income > 0 ? Math.round((saving / income) * 100) : 0,
      };
    });
  }, [selectedYear, yearlySourceItems]);

  const topCategories = useMemo(() => {
    return graphCategories
      .filter((cat) => filter === "saving" ? categorizedNames.saving.includes(cat) : !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const total = yearlySourceItems
          .filter((i) => i.category === cat && (filter === "saving" ? i.spend_type === "saving" : isRealExpense(i)))
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        return { category: cat, total };
      })
      .sort((a, b) => b.total - a.total)
      .filter((i) => i.total > 0)
      .slice(0, 5);
  }, [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);


  // --- 5. 비즈니스 액션 로직 (기존 함수들 그대로 분리 유지) ---
  const handleFileUpload = async (e: any) => { /* 기존 코드 동일 */ };
  const addItem = async () => { /* 기존 코드 동일 */ };
  const deleteItem = async (id: number) => { /* 기존 코드 동일 */ };
  const exportToExcel = () => { /* 기존 코드 동일 */ };
  const startEdit = (item: Item) => { /* 기존 코드 동일 */ };
  const saveBudget = async (category: string, value: string) => { /* 기존 코드 동일 */ };
  const addCategory = async () => { /* 기존 코드 동일 */ };
  const deleteCategory = async (name: string) => { /* 기존 코드 동일 */ };

  return (
    <main className={`min-h-screen p-4 md:p-6 ${darkMode ? "bg-slate-900 text-white" : "bg-zinc-200 text-black"}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-4xl font-extrabold mb-6 ${darkMode ? "text-white" : "text-black"}`}>무계획 속 계획</h1>
        <div className="mb-4">
          <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 rounded-xl bg-black text-white">
            {darkMode ? "☀️ 라이트모드" : "🌙 다크모드"}
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6">
          {["category", "account", "fridge"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab as any)}
              className={`px-4 py-2 rounded-xl border font-medium shadow-sm ${
                mainTab === tab ? "bg-black text-white" : "bg-white/95 text-gray-800 border-gray-300"
              }`}
            >
              {tab === "category" ? "카테고리관리" : tab === "account" ? "가계부" : "냉장고"}
            </button>
          ))}
        </div>

        {mainTab === "account" && (
          <AccountView
            categoryData={categoryData}
            yearlyCategoryData={yearlyCategoryData}
            budgetCompareData={budgetCompareData}
            handleFileUpload={handleFileUpload}
            selectedFileName={selectedFileName}
            exportToExcel={exportToExcel}
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
            savingCategories={categorizedNames.saving}
            categories={categories}
            filteredTotal={totals.filteredTotal}
            SummaryCards={SummaryCards}
            yearlyIncome={totals.yearlyIncome}
            incomeTotal={totals.incomeTotal}
            yearlyExpense={totals.yearlyExpense}
            expenseTotal={totals.expenseTotal}
            yearlySaving={totals.yearlySaving}
            savingTotal={totals.savingTotal}
            yearlyTotal={totals.yearlyTotal}
            total={totals.total}
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
            currentCategories={categorizedNames.current}
            addItem={addItem}
            editingId={editingId}
          />
        )}

        {mainTab === "category" && (
          <CategoryManager
            darkMode={darkMode}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            categoryType={categoryType}
            setCategoryType={setCategoryType}
            addCategory={addCategory}
            fixedCategories={categorizedNames.fixed}
            variableCategories={categorizedNames.variable}
            allowanceCategories={categorizedNames.allowance}
            savingCategories={categorizedNames.saving}
            incomeCategories={categorizedNames.income}
            fetchCategories={fetchCategories}
            deleteCategory={deleteCategory}
          />
        )}

        {mainTab === "fridge" && <FridgeView />}
      </div>

      <DuplicateModal
        darkMode={darkMode}
        duplicateItem={duplicateItem}
        duplicateIndex={duplicateIndex}
        duplicateTotal={duplicateTotal}
        duplicateResolve={duplicateResolve}
        setDuplicateItem={setDuplicateItem}
      />
    </main>
  );
}
