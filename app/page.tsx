"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import MemberView from "@/components/MemberView";
import DuplicateModal from "@/components/DuplicateModal";
import CategoryManager from "@/components/CategoryManager";
import AccountView from "@/components/AccountView";
import IntroPage from "@/components/IntroPage";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import GroupManagementPanel from "@/components/GroupManagementPanel";
import AppSidebar from "@/components/AppSidebar";
import ArchivedGroupsPanel from "@/components/ArchivedGroupsPanel";
import { useGroupData } from "@/hooks/useGroupData";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { useTransactionExcel } from "@/hooks/useTransactionExcel";
import { useCategoryBudgetActions } from "@/hooks/useCategoryBudgetActions";
import { useGroupManagement, type Group } from "@/hooks/useGroupManagement";
import { useBudgetAnalytics } from "@/hooks/useBudgetAnalytics";
import type { Item } from "@/hooks/useGroupData";

export default function Home() {
  // --- 1. 인증 및 공유 그룹 관련 상태 ---
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<Group | null>(null);
  const [deleteGroupNameInput, setDeleteGroupNameInput] = useState("");
  const [showArchivedGroups, setShowArchivedGroups] = useState(false);
  const [loadingGroups, setLoadingGroups] =
    useState(true);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [role, setRole] = useState("member");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("household");

  // --- 2. 일반 가계부 상태 정의 ---
    const [mainTab, setMainTab] = useState<
    "account" | "category" | "members" | "archived"
  >("account");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState("all");
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
  const [selectedFileName, setSelectedFileName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const {
    items,
    loadingItems,
    yearlyItems,
    categories,
    groupMembers,
    budgets,
    refreshTransactionData,
    fetchCategories,
    fetchBudgets,
  } = useGroupData({ currentGroupId, selectedMonth, selectedYear });

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("variable");

  // 중복 데이터 처리 모달 관련 상태
  const [duplicateItem, setDuplicateItem] = useState<any>(null);
  const [duplicateResolve, setDuplicateResolve] = useState<((value: boolean) => void) | null>(null);
  const [duplicateIndex, setDuplicateIndex] = useState(0);
  const [duplicateTotal, setDuplicateTotal] = useState(0);

  const {
    fetchUserGroups,
    createGroup,
    restoreArchivedGroup,
    permanentlyDeleteArchivedGroup,
    handleCopyInviteLink,
  } = useGroupManagement({
    userId: session?.user?.id,
    currentGroupId,
    newGroupName,
    newGroupType,
    deleteGroupNameInput,
    setGroups,
    setArchivedGroups,
    setCurrentGroupId,
    setLoadingGroups,
    setNewGroupName,
    setNewGroupType,
    setDeleteTargetGroup,
    setDeleteGroupNameInput,
    setShowArchivedGroups,
  });

  // 고객지원·공지사항 사이드바에서 선택한 메뉴를 메인 화면에 반영
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const menu = params.get("menu");
    const panel = params.get("panel");

    if (panel === "category" || panel === "members" || panel === "archived") {
      setMainTab(panel);
    } else if (["all", "income", "fixed", "variable", "allowance", "saving"].includes(menu || "")) {
      setMainTab("account");
      setFilter(menu || "all");
      setView("list");
    } else if (menu === "year" || menu === "budget" || menu === "list" || menu === "calendar") {
      setMainTab("account");
      setView(menu);
      if (menu === "list") setFilter("all");
    }
  }, []);

  // --- 3. 인증 및 세션 제어 흐름 ---
  useEffect(() => {
  const init = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
    } finally {
      setAuthLoading(false);
    }
  };

  init();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {

      setSession(session);
    }
  );

  return () => subscription.unsubscribe();
}, []);

  useEffect(() => {
  if (session?.user) {
    fetchUserGroups();
  } else {
    setGroups([]);
    setCurrentGroupId("");
    setLoadingGroups(false);
  }
}, [session]);

  // 구글 로그인 핸들러 함수
  const handleGoogleSignIn = async () => {
    const pendingInvite = localStorage.getItem("pendingInvite");

    const redirectUrl = pendingInvite || window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      alert(`구글 로그인 실패: ${error.message}`);
    }
  };

  

  useEffect(() => {
    const fetchRole = async () => {
      if (!currentGroupId || !session?.user?.id) return;

      const { data } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", currentGroupId)
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
    };

    fetchRole();
  }, [currentGroupId, session]);

  const {
    categorizedNames, graphCategories, isRealExpense, creatorFilteredItems,
    creatorFilteredYearlyItems, periodFilteredItems, yearlySourceItems,
    categoryData, yearlyCategoryData, totals, budgetCompareData,
    variableBudgetTotal, remainVariableBudget, monthlyData, topCategories,
  } = useBudgetAnalytics({
    categories, type, spendType, filter, selectedCreator, items, yearlyItems,
    view, search, categoryFilter, startDate, endDate, selectedYear, budgets,
  });

  useEffect(() => {
    if (categorizedNames.current.length > 0 && !categorizedNames.current.includes(category)) {
      setCategory(categorizedNames.current[0]);
    }
  }, [categorizedNames.current.join(","), category]);

  const { addItem, deleteItem, startEdit } = useTransactionActions({
    name,
    amount,
    type,
    category,
    date,
    spendType,
    memo,
    currentGroupId,
    userId: session?.user?.id,
    editingId,
    currentCategories: categorizedNames.current,
    setEditingId,
    setName,
    setAmount,
    setType,
    setCategory,
    setSpendType,
    setDate,
    setMemo,
    refreshTransactionData,
  });

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

const sumAmount = (list: Item[]) =>
  list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const creatorFilteredItems = useMemo(() => {
    return selectedCreator === "all"
      ? items
      : items.filter((item) => item.user_id === selectedCreator);
  }, [items, selectedCreator]);

  const creatorFilteredYearlyItems = useMemo(() => {
    return selectedCreator === "all"
      ? yearlyItems
      : yearlyItems.filter((item) => item.user_id === selectedCreator);
  }, [yearlyItems, selectedCreator]);

  const periodFilteredItems = useMemo(() => {
    const baseItems = (startDate || endDate)
      ? creatorFilteredYearlyItems
      : (view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems);
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
  }, [creatorFilteredItems, creatorFilteredYearlyItems, view, filter, search, categoryFilter, startDate, endDate]);

  // 연요약은 기간 검색/리스트 필터와 분리해 선택 연도의 전체 거래를 기준으로 계산
  const yearlySourceItems = creatorFilteredYearlyItems;

  const getCategoryData = (sourceList: Item[]) => {
    return graphCategories
      .filter((cat) => filter === "saving" ? categorizedNames.saving.includes(cat) : !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const totalAmount = sumAmount(
  sourceList.filter((item) => {
    if (item.category !== cat) return false;
    if (filter === "saving") return item.spend_type === "saving";
    return isRealExpense(item) && (filter === "all" ? true : item.spend_type === filter);
  })
);

        return { name: cat, value: totalAmount };
      });
  };

  const categoryData = useMemo(() => getCategoryData(periodFilteredItems), [graphCategories, filter, categorizedNames.saving, periodFilteredItems]);
  const yearlyCategoryData = useMemo(() => getCategoryData(yearlySourceItems), [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);

   const totals = useMemo(() => {
  const inc = sumAmount(creatorFilteredItems.filter((i) => i.type === "income"));
    const exp = sumAmount(creatorFilteredItems.filter(isRealExpense));
    const sav = sumAmount(creatorFilteredItems.filter((i) => i.spend_type === "saving"));

    const yInc = sumAmount(yearlySourceItems.filter((i) => i.type === "income"));
    const yExp = sumAmount(yearlySourceItems.filter(isRealExpense));
    const ySav = sumAmount(yearlySourceItems.filter((i) => i.spend_type === "saving"));

    const filtTot = filter === "income"
      ? sumAmount(periodFilteredItems.filter((i) => i.type === "income"))
      : sumAmount(periodFilteredItems.filter(isRealExpense));

    return {
      incomeTotal: inc, expenseTotal: exp, savingTotal: sav, total: inc - exp,
      yearlyIncome: yInc, yearlyExpense: yExp, yearlySaving: ySav, yearlyTotal: yInc - yExp,
      filteredTotal: filtTot
    };
  }, [creatorFilteredItems, yearlySourceItems, periodFilteredItems, filter]);

  const budgetCompareData = useMemo(() => {
    const sourceItems = view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems;
    return graphCategories
      .filter((cat) => !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const spent = sumAmount(
  sourceItems.filter((i) => i.category === cat && isRealExpense(i))
);
        const budget = Number(budgets[cat] || 0);
        return { name: cat, 사용금액: spent, 남은예산: budget - spent };
      });
  }, [graphCategories, categorizedNames.saving, view, creatorFilteredYearlyItems, creatorFilteredItems, budgets]);

  const { variableBudgetTotal, remainVariableBudget } = useMemo(() => {
    const sourceItems = view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems;
    const targets = graphCategories.filter((cat) => !categorizedNames.saving.includes(cat));

    const vBudgetTot = targets.reduce((s, cat) => s + Number(budgets[cat] || 0), 0);
    const rVariableBudget = targets.reduce((sum, cat) => {
      const spent = sumAmount(
        sourceItems.filter((i) => i.category === cat && isRealExpense(i))
      );
      const budget = Number(budgets[cat] || 0);
      return sum + (budget - spent);
    }, 0);

    return { variableBudgetTotal: vBudgetTot, remainVariableBudget: rVariableBudget };
  }, [graphCategories, categorizedNames.saving, view, creatorFilteredYearlyItems, creatorFilteredItems, budgets]);

    const monthlyData = useMemo(() => {
  return Array.from({ length: 12 }, (_, i) => {
      const month = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const monthItems = yearlySourceItems.filter((item) => item.date && item.date.startsWith(month));

      const income = sumAmount(monthItems.filter((item) => item.type === "income"));
      const expense = sumAmount(monthItems.filter(isRealExpense));
      const saving = sumAmount(monthItems.filter((item) => item.spend_type === "saving"));

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
        const total = sumAmount(
  yearlySourceItems.filter(
    (i) => i.category === cat && (filter === "saving" ? i.spend_type === "saving" : isRealExpense(i))
  )
);
        return { category: cat, total };
      })
      .sort((a, b) => b.total - a.total)
      .filter((i) => i.total > 0)
      .slice(0, 5);
  }, [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);

  // --- 7. 카테고리 및 예산 액션 핸들러 ---
  const {
    addCategory: createCategory,
    deleteCategory,
    saveBudget,
  } = useCategoryBudgetActions({
    currentGroupId,
    userId: session?.user?.id,
    selectedMonth,
    fetchCategories,
    fetchBudgets,
  });

  const addCategory = async () => {
    if (!categoryName.trim() || !currentGroupId) return;
    await createCategory(categoryName, categoryType);
    setCategoryName("");
  };

  const { handleFileUpload, exportToExcel } = useTransactionExcel({
    currentGroupId,
    userId: session?.user?.id,
    selectedMonth,
    items,
    setSelectedFileName,
    setDuplicateItem,
    setDuplicateResolve,
    setDuplicateIndex,
    setDuplicateTotal,
    refreshTransactionData,
  });

  // --- 8. 미인증 상태 UI (소셜 로그인 전용 화면) ---
  if (authLoading) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      로딩중...
    </main>
  );
}

  if (!session) return <IntroPage />;

  // --- 9. 메인 레이아웃 렌더링 ---
  return (
    <main className="min-h-screen bg-[#fffaff] px-3 pt-16 pb-4 text-[#292238] sm:px-5 sm:py-6 md:px-6 md:pl-20">
      <div className="mx-auto w-full max-w-6xl">
        <AnnouncementPopup />
        

        
        {/* 공유 가계부 관리 패널 */}
        <GroupManagementPanel
          groups={groups}
          currentGroupId={currentGroupId}
          setCurrentGroupId={setCurrentGroupId}
          newGroupType={newGroupType}
          setNewGroupType={setNewGroupType}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          createGroup={createGroup}
          handleCopyInviteLink={handleCopyInviteLink}
        />

        <AppSidebar
          mainTab={mainTab}
          setMainTab={setMainTab}
          filter={filter}
          setFilter={setFilter}
          view={view}
          setView={setView}
          role={role}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* 컨텐츠 조건부 뷰 출력 */}
        {loadingGroups ? (
  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#f0e8f5] bg-white shadow-sm">
    <div className="text-sm font-semibold text-[#81768c]">
      불러오는 중...
    </div>
  </div>
) : !currentGroupId && mainTab === "account" ? (
          <div className="rounded-2xl border border-dashed border-[#d9e0e8] bg-white px-4 py-20 text-center shadow-sm sm:py-24">
  <span className="mb-4 block text-5xl">🏠</span>
  <p className="text-lg font-bold text-[#292238]">
    활성화된 가계부 방이 존재하지 않습니다.
  </p>
  <p className="mt-2 text-sm leading-6 text-[#81768c]">
    상단에서 새 가계부를 개설하거나 다른 가계부에 초대받아야 내역 관리가 가능합니다.
  </p>
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
                loadingItems={loadingItems}
                groupMembers={groupMembers}
                selectedCreator={selectedCreator}
                setSelectedCreator={setSelectedCreator}
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
                view={view}
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
                graphCategories={graphCategories}
                savingCategories={categorizedNames.saving}
                categories={categories}
                filteredTotal={totals.filteredTotal}
                incomeTotal={totals.incomeTotal}
                yearlyIncome={totals.yearlyIncome}
                expenseTotal={totals.expenseTotal}
                yearlyExpense={totals.yearlyExpense}
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
                role={role}
              />
            )}

            {mainTab === "category" && (
              <CategoryManager
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
                deleteCategory={deleteCategory}
              />
            )}

            {mainTab === "archived" && (
              <ArchivedGroupsPanel
                archivedGroups={archivedGroups}
                deleteTargetGroup={deleteTargetGroup}
                setDeleteTargetGroup={setDeleteTargetGroup}
                deleteGroupNameInput={deleteGroupNameInput}
                setDeleteGroupNameInput={setDeleteGroupNameInput}
                restoreArchivedGroup={restoreArchivedGroup}
                permanentlyDeleteArchivedGroup={permanentlyDeleteArchivedGroup}
              />
            )}

            {mainTab === "members" && (
  <MemberView
    currentGroupId={currentGroupId}
    role={role}
    onLeave={async () => {
      await fetchUserGroups();
      setMainTab("account");
    }}
  />
)}
          </>
        )}
      </div>

      <DuplicateModal
        duplicateItem={duplicateItem}
        duplicateIndex={duplicateIndex}
        duplicateTotal={duplicateTotal}
        duplicateResolve={duplicateResolve}
        setDuplicateItem={setDuplicateItem}
      />
    </main>
  );
}
