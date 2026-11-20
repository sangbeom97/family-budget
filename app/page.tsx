"use client";

import { useEffect, useState, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { GROUP_CATEGORY_TEMPLATES } from "@/lib/groupCategoryTemplates";
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
import type { Item } from "@/hooks/useGroupData";

type Group = {
  id: string;
  name: string;
  group_type?: string;
  archived_at?: string;
};

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

  // 🎯 진짜 초대 코드(invite_code)를 저장할 상태 추가
  const [currentInviteCode, setCurrentInviteCode] = useState<string>("");

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

  

  // --- 4. 그룹 및 공유 관리 비즈니스 로직 ---
  const fetchUserGroups = async () => {
  const user = session?.user;

  if (!user) {
    setGroups([]);
    setArchivedGroups([]);
    setCurrentGroupId("");
    setLoadingGroups(false);
    return;
  }

  setLoadingGroups(true);

  try {
    const { data: archivedRows, error: archivedError } = await supabase.rpc(
      "get_my_archived_groups"
    );

    if (archivedError) {
      console.error("보관된 모임 조회 실패:", archivedError);
      setArchivedGroups([]);
    } else {
      setArchivedGroups((archivedRows || []) as Group[]);
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (memberError) throw memberError;

    const groupIds =
      memberRows?.map((row) => row.group_id).filter(Boolean) || [];

    let groupRows: any[] = [];
    if (groupIds.length > 0) {
      const typedGroups = await supabase
        .from("groups")
        .select("id, name, group_type")
        .in("id", groupIds)
        .is("archived_at", null);

      if (typedGroups.error) {
        const legacyGroups = await supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIds)
          .is("archived_at", null);
        if (legacyGroups.error) throw legacyGroups.error;
        groupRows = (legacyGroups.data || []).map((group) => ({
          ...group,
          group_type: "custom",
        }));
      } else {
        groupRows = typedGroups.data || [];
      }
    }

    setGroups(groupRows);

    const savedGroupId = localStorage.getItem("currentGroupId");
    if (savedGroupId && groupRows.some((g) => g.id === savedGroupId)) {
      setCurrentGroupId(savedGroupId);
    } else {
      const firstGroupId = groupRows[0]?.id || "";
      setCurrentGroupId(firstGroupId);
      if (firstGroupId) {
        localStorage.setItem("currentGroupId", firstGroupId);
      } else {
        localStorage.removeItem("currentGroupId");
      }
    }
  } catch (error) {
    console.error("fetchUserGroups error:", error);
    setGroups([]);
    setCurrentGroupId("");
  } finally {
    setLoadingGroups(false);
  }
};

const restoreArchivedGroup = async (group: Group) => {
  if (!confirm(`"${group.name}" 모임을 다시 불러올까요?\\n\\n기존 거래내역·예산·카테고리가 그대로 복구됩니다.`)) {
    return;
  }

  const { error } = await supabase.rpc("restore_group", {
    p_group_id: group.id,
  });

  if (error) {
    alert(`모임 복구 실패: ${error.message}\\n\\nSupabase SQL Editor에서 supabase/restore_archived_groups.sql을 먼저 실행했는지 확인해주세요.`);
    return;
  }

  await fetchUserGroups();
  setCurrentGroupId(group.id);
  localStorage.setItem("currentGroupId", group.id);
  setShowArchivedGroups(false);
  alert(`"${group.name}" 모임이 복구되었습니다.`);
};

const permanentlyDeleteArchivedGroup = async (group: Group) => {
  if (deleteGroupNameInput !== group.name) {
    alert("모임명이 정확히 일치하지 않습니다.");
    return;
  }

  const { error } = await supabase.rpc("delete_archived_group", {
    p_group_id: group.id,
    p_group_name: deleteGroupNameInput,
  });

  if (error) {
    alert(`모임 영구 삭제 실패: ${error.message}`);
    return;
  }

  setDeleteTargetGroup(null);
  setDeleteGroupNameInput("");
  await fetchUserGroups();
  alert(`"${group.name}" 모임과 연결된 데이터가 영구 삭제되었습니다.`);
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

  // 🎯 활성화된 방이 바뀔 때마다 해당 방의 진짜 invite_code를 조회해 오는 로직
  const fetchCurrentGroupInviteCode = async () => {
    if (!currentGroupId) {
      setCurrentInviteCode("");
      return;
    }
    const { data } = await supabase
      .from("groups")
      .select("invite_code")
      .eq("id", currentGroupId)
      .maybeSingle();

    setCurrentInviteCode(data?.invite_code || "");
  };

  useEffect(() => {
    fetchCurrentGroupInviteCode();
  }, [currentGroupId]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    const { data: newGroup, error: groupError } = await supabase
      .from("groups")
      .insert([{
        name: newGroupName.trim(), group_type: newGroupType,
        created_by: session?.user?.id,
        invite_code: crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(),
      }])
      .select()
      .single();

    if (groupError) {
      alert(`가계부 생성 실패: ${groupError.message}\\n\\n가계부 유형 기능을 사용하려면 Supabase에 group_type 컬럼 추가 SQL을 먼저 실행해주세요.`);
      return;
    }
    if (!newGroup) return;

    const { error: memberError } = await supabase.from("group_members").insert([{
      group_id: newGroup.id, user_id: session?.user?.id, role: "owner",
    }]);
    if (memberError) {
      alert(`모임장 등록 실패: ${memberError.message}`);
      return;
    }

    const template = GROUP_CATEGORY_TEMPLATES[newGroupType] || [];
    if (template.length > 0) {
      const { error: categoryError } = await supabase.from("categories").insert(
        template.map((item) => ({ ...item, group_id: newGroup.id, user_id: session?.user?.id }))
      );
      if (categoryError) alert(`가계부는 생성됐지만 기본 카테고리 생성에 실패했습니다: ${categoryError.message}`);
    }

    setNewGroupName("");
    setNewGroupType("household");
    await fetchUserGroups();
    setCurrentGroupId(newGroup.id);
  };

  // 🎯 원클릭 초대링크 생성 및 카카오톡 복사 핸들러 함수
  const handleCopyInviteLink = () => {
    if (!currentInviteCode) {
      alert("현재 가계부 방에 설정된 초대 코드가 없습니다. Supabase groups 테이블에 코드를 채워주세요!");
      return;
    }

    const domain = window.location.origin;
    const inviteUrl = `${domain}/invite?code=${currentInviteCode}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => alert("✨ 카카오톡 초대 링크가 클립보드에 복사되었습니다!\n카톡창에 Ctrl+V로 공유해 보세요."))
        .catch(() => alert("링크 복사에 실패했습니다. 주소: " + inviteUrl));
    } else {
      alert("초대 링크 주소: " + inviteUrl);
    }
  };

  // --- 6. 연산 최적화 연산 메모이제이션 (useMemo) ---
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
    const addCategory = async () => {
    if (!categoryName.trim() || !currentGroupId) return;
    await supabase.from("categories").insert([
      { name: categoryName.trim(), type: categoryType, group_id: currentGroupId, user_id: session?.user?.id }
    ]);
    setCategoryName("");
    fetchCategories();
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`[${name}] 카테고리를 삭제하시겠습니까?`)) return;
    await supabase.from("categories").delete().eq("group_id", currentGroupId).eq("name", name);
    fetchCategories();
  };

  const saveBudget = async (catName: string, value: string) => {
    if (!currentGroupId) return;
    const numValue = Number(value) || 0;

    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("group_id", currentGroupId)
      .eq("month", selectedMonth)
      .eq("category", catName);

    if (data && data.length > 0) {
      await supabase
        .from("budgets")
        .update({ amount: numValue })
        .eq("group_id", currentGroupId)
        .eq("month", selectedMonth)
        .eq("category", catName);
    } else {
      await supabase.from("budgets").insert([
        { group_id: currentGroupId, month: selectedMonth, category: catName, amount: numValue }
      ]);
    }
    fetchBudgets();
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
