"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

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
  user_id?: string;
  group_id?: string;
};

type Category = {
  id: number;
  name: string;
  type: string;
};

type Group = {
  id: string;
  name: string;
};

export default function Home() {
  // --- [추가] 인증 및 공유 그룹 관련 상태 ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");

  // --- 기존 상태 정의 유지 ---
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

  const [duplicateItem, setDuplicateItem] = useState<any>(null);
  const [duplicateResolve, setDuplicateResolve] = useState<((value: boolean) => void) | null>(null);
  const [duplicateIndex, setDuplicateIndex] = useState(0);
  const [duplicateTotal, setDuplicateTotal] = useState(0);

  // --- [변경/인증] 유저 세션 실시간 감지 및 초기 그룹 매핑 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserGroups();
    }
  }, [session]);

  // --- [추가] 인증 관련 핸들러 ---
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(`회원가입 실패: ${error.message}`);
    else alert("회원가입 성공 인증 이메일을 확인해 주세요!");
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(`로그인 실패: ${error.message}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentGroupId("");
    setGroups([]);
  };

  // --- [추가] 가계부 방 공유 및 멤버 초대 액션 로직 ---
  const fetchUserGroups = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", session?.user?.id);

    if (data) {
      const mappedGroups = data.map((item: any) => item.groups).filter(Boolean);
      setGroups(mappedGroups);
      if (mappedGroups.length > 0 && !currentGroupId) {
        setCurrentGroupId(mappedGroups[0].id);
      }
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    const { data: newGroup, error: groupErr } = await supabase
      .from("groups")
      .insert([{ name: newGroupName, created_by: session?.user?.id }])
      .select()
      .single();

    if (newGroup) {
      await supabase.from("group_members").insert([{ group_id: newGroup.id, user_id: session?.user?.id }]);
      setNewGroupName("");
      fetchUserGroups();
      setCurrentGroupId(newGroup.id);
    }
  };

  const inviteUser = async () => {
    if (!inviteUserId.trim() || !currentGroupId) return;
    const { error } = await supabase
      .from("group_members")
      .insert([{ group_id: currentGroupId, user_id: inviteUserId }]);

    if (error) alert("초대에 실패했습니다. 유저 고유 ID(UUID)를 확인해 주세요.");
    else {
      alert("해당 유저를 가계부 그룹에 성공적으로 초대했습니다!");
      setInviteUserId("");
    }
  };

  // --- [변경] 데이터 Fetch 함수들 (선택한 group_id 단위로 격리 쿼리 적용) ---
  const fetchItems = async () => {
    if (!currentGroupId) return;
    const startDateObj = new Date(`${selectedMonth}-01`);
    const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0);

    const start = `${selectedMonth}-01`;
    const end = `${selectedMonth}-${String(endDateObj.getDate()).padStart(2, "0")}`;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("group_id", currentGroupId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    setItems(data || []);
  };

  const fetchYearlyItems = async () => {
    if (!currentGroupId) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("group_id", currentGroupId)
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`);

    setYearlyItems(data || []);
  };

  const fetchCategories = async () => {
    if (!currentGroupId) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("group_id", currentGroupId);
    setCategories(data || []);
  };

  const fetchBudgets = async () => {
    if (!currentGroupId) return;
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("group_id", currentGroupId)
      .eq("month", selectedMonth);
    const budgetMap: Record<string, string> = {};
    data?.forEach((item: any) => {
      budgetMap[item.category] = item.amount.toString();
    });
    setBudgets(budgetMap);
  };

  // --- useEffect 최적화 의존성 정돈 ---
  useEffect(() => {
    if (currentGroupId) {
      fetchItems();
      fetchYearlyItems();
      fetchBudgets();
      fetchCategories();
    } else {
      setItems([]);
      setYearlyItems([]);
      setBudgets({});
      setCategories([]);
    }
  }, [selectedMonth, selectedYear, currentGroupId]);

  // --- 기존의 비즈니스 useMemo 최적화 흐름 완벽 유지 ---
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

  // --- 기존 목스/액션 부분 핸들러 생략 구문 유지 ---
  const handleFileUpload = async (e: any) => {};
  const addItem = async () => {};
  const deleteItem = async (id: number) => {};
  const exportToExcel = () => {};
  const startEdit = (item: Item) => {};
  const saveBudget = async (category: string, value: string) => {};
  const addCategory = async () => {};
  const deleteCategory = async (name: string) => {};

  // --- [1단계 체크] 비인증 상태일 때 전용 인트로 및 로그인 UI 노출 ---
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-700">
          <h2 className="text-3xl font-extrabold text-center mb-2 tracking-tight text-slate-900 dark:text-white">📊 무계획 속 계획</h2>
          <p className="text-center text-xs text-gray-400 dark:text-gray-400 mb-8 font-medium">우리 집, 모임 지출을 투명하게 공유하고 관리하세요.</p>
          <div className="space-y-4">
            <input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 text-sm font-medium bg-transparent border-gray-200 dark:border-slate-700 outline-none focus:border-blue-500 text-black dark:text-white" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 text-sm font-medium bg-transparent border-gray-200 dark:border-slate-700 outline-none focus:border-blue-500 text-black dark:text-white" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={handleSignIn} className="py-3 rounded-xl bg-black text-white text-sm font-bold shadow-sm hover:bg-slate-800 transition">로그인</button>
              <button onClick={handleSignUp} className="py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-slate-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition">회원가입</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- [2단계] 인증 통과 시 메인 대시보드 화면 ---
  return (
    <main className={`min-h-screen p-4 md:p-6 ${darkMode ? "bg-slate-900 text-white" : "bg-zinc-200 text-black"}`}>
      <div className="max-w-6xl mx-auto">
        {/* 헤더 및 유저 제어 영역 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">무계획 속 계획</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">내 고유 코드: {session.user.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium">
              {darkMode ? "☀️ 라이트모드" : "🌙 다크모드"}
            </button>
            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold shadow-sm">
              로그아웃
            </button>
          </div>
        </div>

        {/* --- [추가] 가계부 공유 룸 컨트롤러 바 --- */}
        <div className={`p-4 rounded-2xl border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
          {/* 가계부 방 선택 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">현재 활성화된 공유 가계부</label>
            <select value={currentGroupId} onChange={(e) => setCurrentGroupId(e.target.value)} className="w-full border-2 rounded-xl px-3 py-2 text-sm bg-transparent border-gray-200 dark:border-slate-600 font-bold outline-none text-black dark:text-white">
              {groups.length === 0 && <option value="">소속된 방이 없습니다</option>}
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {/* 가계부 방 생성 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">새 공유 가계부 만들기</label>
            <div className="flex gap-2">
              <input type="text" placeholder="방 이름 (예: 부부 가계부)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full border-2 rounded-xl px-3 py-1.5 text-sm bg-transparent border-gray-200 dark:border-slate-600 outline-none text-black dark:text-white" />
              <button onClick={createGroup} className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap">개설</button>
            </div>
          </div>
          {/* 가계부 다른 멤버 초대 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">이 가계부에 다른 사람 추가</label>
            <div className="flex gap-2">
              <input type="text" placeholder="상대방 고유 ID 입력" value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)} className="w-full border-2 rounded-xl px-3 py-1.5 text-sm bg-transparent border-gray-200 dark:border-slate-600 outline-none text-black dark:text-white" />
              <button onClick={inviteUser} className="bg-green-600 text-white px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap">초대</button>
            </div>
          </div>
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

        {/* 방이 아직 개설되지 않은 경우의 안내 */}
        {mainTab === "account" && !currentGroupId ? (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-600">
            <span className="text-5xl block mb-4">🏠</span>
            <p className="font-bold text-lg">활성화된 가계부 방이 존재하지 않습니다.</p>
            <p className="text-sm text-gray-400 mt-1">상단에서 새 가계부를 개설하거나 다른 가계부에 초대받아야 내역 관리가 가능합니다.</p>
          </div>
        ) : (
          <>
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
    incomeTotal={totals.incomeTotal}      {/* 깔끔하게 1줄로 정돈 */}
    yearlyIncome={totals.yearlyIncome}    {/* 깔끔하게 1줄로 정돈 */}
    expenseTotal={totals.expenseTotal}    {/* 깔끔하게 1줄로 정돈 */}
    yearlyExpense={totals.yearlyExpense}  {/* 깔끔하게 1줄로 정돈 */}
    savingTotal={totals.savingTotal}
    yearlySaving={totals.yearlySaving}
    total={totals.total}
    yearlyTotal={totals.yearlyTotal}
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

            {mainTab === "fridge" && <FridgeView />}
          </>
        )}
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
