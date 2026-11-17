"use client";

import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import MemberView from "@/components/MemberView";
import SummaryCards from "@/components/SummaryCards";
import DuplicateModal from "@/components/DuplicateModal";
import CategoryManager from "@/components/CategoryManager";
import AccountView from "@/components/AccountView";
import IntroPage from "@/components/IntroPage";
import AnnouncementPopup from "@/components/AnnouncementPopup";

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
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [yearlyItems, setYearlyItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ id: string; nickname: string }[]>([]);
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

  const [budgets, setBudgets] = useState<Record<string, string>>({});
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

    const categoryTemplates: Record<string, { name: string; type: string }[]> = {
      household: [
        { name: "주거비", type: "fixed" }, { name: "통신비", type: "fixed" },
        { name: "보험료", type: "fixed" }, { name: "구독료", type: "fixed" },
        { name: "식비", type: "variable" }, { name: "생활용품", type: "variable" },
        { name: "교통·차량", type: "variable" }, { name: "의료·건강", type: "variable" },
        { name: "여가·문화", type: "variable" }, { name: "육아·교육", type: "variable" },
        { name: "개인용돈", type: "allowance" }, { name: "저축", type: "saving" },
        { name: "투자", type: "saving" }, { name: "급여", type: "income" },
        { name: "부수입", type: "income" }, { name: "기타수입", type: "income" },
      ],
      club: [
        { name: "정기회비", type: "income" }, { name: "추가회비", type: "income" },
        { name: "후원금", type: "income" }, { name: "기타수입", type: "income" },
        { name: "식비·회식", type: "variable" }, { name: "행사비", type: "variable" },
        { name: "운영비", type: "fixed" }, { name: "교통비", type: "variable" },
        { name: "물품구입", type: "variable" }, { name: "기타지출", type: "variable" },
        { name: "예비비", type: "saving" },
      ],
      trip: [
        { name: "공동경비 입금", type: "income" }, { name: "추가분담금", type: "income" },
        { name: "숙박", type: "variable" }, { name: "교통", type: "variable" },
        { name: "식비", type: "variable" }, { name: "관광·활동", type: "variable" },
        { name: "준비물", type: "variable" }, { name: "기타비용", type: "variable" },
      ],
      custom: [],
    };

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

    const template = categoryTemplates[newGroupType] || [];
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

  // --- 5. 가계부 데이터 Fetch 로직 ---
    const fetchItems = async () => {
    if (!currentGroupId) return;

    setLoadingItems(true);

    try {
      const startDateObj = new Date(`${selectedMonth}-01`);
      const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0);

      const start = `${selectedMonth}-01`;
      const end = `${selectedMonth}-${String(endDateObj.getDate()).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("group_id", currentGroupId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error("거래내역 조회 실패:", error);
    } finally {
      setLoadingItems(false);
    }
  };

    const fetchYearlyItems = async () => {
    if (!currentGroupId) return;

    try {
      // Supabase 기본 조회 제한(최대 1,000행)으로 연간 거래가 누락되지 않도록 페이지 단위로 전체 조회
      const allYearItems: Item[] = [];
      const pageSize = 1000;
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("group_id", currentGroupId)
          .gte("date", `${selectedYear}-01-01`)
          .lte("date", `${selectedYear}-12-31`)
          .order("date", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        const page = data || [];
        allYearItems.push(...page);
        if (page.length < pageSize) break;
        from += pageSize;
      }

      setYearlyItems(allYearItems);
    } catch (error) {
      console.error("연간 거래내역 조회 실패:", error);
    }
  };

    const refreshTransactionData = () => {
        fetchItems();
        fetchYearlyItems();
      };

    const fetchCategories = async () => {
    if (!currentGroupId) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("group_id", currentGroupId);

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error("카테고리 조회 실패:", error);
    }
  };

    // 현재 그룹 멤버의 표시 이름 조회
  const fetchGroupMembers = async () => {
    if (!currentGroupId) {
      setGroupMembers([]);
      return;
    }

    try {
      const { data: memberRows, error } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", currentGroupId);

      if (error) throw error;

      if (!memberRows?.length) {
        setGroupMembers([]);
        return;
      }

      const userIds = memberRows.map((member) => member.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", userIds);

      if (profileError) throw profileError;

      setGroupMembers(
        (profiles || []).map((profile) => ({
          id: profile.id,
          nickname: profile.nickname || "이름 없음",
        }))
      );
    } catch (error) {
      console.error("그룹 멤버 조회 실패:", error);
      setGroupMembers([]);
    }
  };

  const fetchBudgets = async () => {
    if (!currentGroupId) return;
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("group_id", currentGroupId)
      .eq("month", selectedMonth);
    const budgetMap: Record<string, string> = {};
    data?.forEach((item) => {
      budgetMap[item.category] = item.amount.toString();
    });
    setBudgets(budgetMap);
  };

  useEffect(() => {
  if (currentGroupId) {
    refreshTransactionData();
    fetchBudgets();
    fetchCategories();
    fetchGroupMembers();
  } else {
      setItems([]);
      setYearlyItems([]);
      setBudgets({});
      setCategories([]);
      setGroupMembers([]);
    }
  }, [selectedMonth, selectedYear, currentGroupId]);

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

  // --- 7. 비즈니스 액션 핸들러 ---
  const addItem = async () => {
    if (!name.trim() || !amount.trim() || !currentGroupId) return;

    const finalCategory = category || categorizedNames.current[0] || "기타";

    const payload = {
      name,
      amount: Number(amount),
      type,
      category: finalCategory,
      date,
      spend_type: type === "income" ? "income" : spendType,
      memo,
      group_id: currentGroupId,
    };

    if (editingId) {
      // 수정 시 최초 작성자(user_id)는 변경하지 않습니다.
      await supabase.from("transactions").update(payload).eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("transactions").insert([{
        ...payload,
        user_id: session?.user?.id,
      }]);
    }

    setName("");
    setAmount("");
    setMemo("");
    refreshTransactionData();
  };

  const deleteItem = async (id: number) => {
    if (!confirm("정말 이 내역을 삭제하시겠습니까?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    refreshTransactionData();
  };

    const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(item.amount.toString());
    setType(item.type);
    setCategory(item.category);
    setSpendType(item.type === "income" ? "variable" : item.spend_type);
    setDate(item.date);
    setMemo(item.memo);

    document.getElementById("transaction-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentGroupId) return;
  setSelectedFileName(file.name);

  const reader = new FileReader();

  reader.onload = async () => {
    const bstr = reader.result as string;
    const wb = XLSX.read(bstr, { type: "binary" });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    const parsedItems = data.map((row) => {
      const rawAmount = String(row["금액"] || "").replace(/[^0-9-]/g, "");
      const parsedAmount = Number(rawAmount);

      return {
        name: (row["내역명"] || row["항목"] || "미지정") as string,
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        type: row["타입"] === "수입" ? "income" : "expense",
        category: (row["카테고리"] || "기타") as string,
        date: (row["날짜"] || new Date().toISOString().split("T")[0]) as string,
        spend_type: (row["지출분류"] || "variable") as string,
        memo: (row["메모"] || "") as string,
        group_id: currentGroupId,
        user_id: session?.user?.id,
      };
    });

    if (parsedItems.length === 0) {
      alert("업로드할 데이터가 없습니다.");
      return;
    }

    const { data: existingData, error: existingError } = await supabase
      .from("transactions")
      .select("id, name, amount, type, category, date, spend_type, memo")
      .eq("group_id", currentGroupId);

    if (existingError) {
      alert("기존 거래내역을 불러오지 못했습니다.");
      return;
    }

    const knownItems: {
      id?: number;
      name: string;
      amount: number;
      type: string;
      category: string;
      date: string;
      spend_type: string;
      memo: string;
    }[] = (existingData || []).map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: item.date,
      spend_type: item.spend_type,
      memo: item.memo,
    }));

    const duplicateMatches: ({ oldItem: (typeof knownItems)[number] } | null)[] = [];

    for (const item of parsedItems) {
      const duplicate = knownItems.find(
        (old) =>
          old.date === item.date &&
          old.name.trim() === item.name.trim() &&
          Number(old.amount) === Number(item.amount) &&
          old.type === item.type &&
          old.category === item.category
      );

      duplicateMatches.push(duplicate ? { oldItem: duplicate } : null);
      knownItems.push(item);
    }

    const duplicateTotal = duplicateMatches.filter(Boolean).length;
    const itemsToInsert = [];
    let duplicateIndex = 0;

    for (let i = 0; i < parsedItems.length; i++) {
      const match = duplicateMatches[i];

      if (match) {
        duplicateIndex++;

        const shouldAdd = await new Promise<boolean>((resolve) => {
          setDuplicateResolve(() => resolve);
          setDuplicateItem({
            newItem: parsedItems[i],
            oldItem: match.oldItem,
          });
          setDuplicateIndex(duplicateIndex);
          setDuplicateTotal(duplicateTotal);
        });

        setDuplicateResolve(null);

        if (!shouldAdd) continue;
      }

      itemsToInsert.push(parsedItems[i]);
    }

    if (itemsToInsert.length === 0) {
      alert("등록할 거래가 없습니다. 중복 거래를 모두 건너뛰었습니다.");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .insert(itemsToInsert);

    if (error) {
      alert("거래내역 업로드에 실패했습니다.");
      console.error("Excel 업로드 실패:", error);
      return;
    }

    refreshTransactionData();

    alert(
      `${itemsToInsert.length}건의 거래를 등록했습니다.\n중복 의심 거래 ${duplicateTotal}건`
    );
  };

  reader.readAsBinaryString(file);
};

  const exportToExcel = () => {
    if (items.length === 0) return alert("내보낼 데이터가 없습니다.");
    const excelData = items.map((i) => ({
      날짜: i.date,
      내역명: i.name,
      금액: i.amount,
      타입: i.type === "income" ? "수입" : "지출",
      카테고리: i.category,
      지출분류: i.spend_type,
      메모: i.memo,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "가계부내역");
    XLSX.writeFile(workbook, `가계부_내역_${selectedMonth}.xlsx`);
  };

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
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-[#f0e8f5] bg-white p-4 shadow-sm sm:p-5 md:grid-cols-3">

          {/* 현재 가계부 선택 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <label className="text-sm font-bold text-[#292238]">
                현재 가계부
              </label>
            </div>

            <select
              value={currentGroupId}
              onChange={(e) => {
                setCurrentGroupId(e.target.value);
                localStorage.setItem("currentGroupId", e.target.value);
              }}
              className="min-h-11 w-full rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm font-semibold text-[#292238] outline-none transition focus:border-[#9145c9]"
            >
              {groups.length === 0 && (
                <option value="">소속된 방이 없습니다</option>
              )}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#81768c]">
              관리할 공유 가계부를 선택하세요.
            </p>
          </div>

          {/* 새 가계부 만들기 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">➕</span>
              <label className="text-sm font-bold text-[#292238]">
                새 가계부 만들기
              </label>
            </div>

            <div className="space-y-2">
              <select
                value={newGroupType}
                onChange={(e) => setNewGroupType(e.target.value)}
                className="min-h-10 w-full rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm text-[#292238] outline-none focus:border-[#9145c9]"
              >
                <option value="household">부부·가족용</option>
                <option value="club">모임·동아리용</option>
                <option value="trip">여행·프로젝트용</option>
                <option value="custom">직접 설정</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 우리 가족 가계부"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm text-[#292238] outline-none transition placeholder:text-[#b0b8c1] focus:border-[#9145c9]"
                />
                <button
                  onClick={createGroup}
                  className="shrink-0 rounded-xl bg-[#9145c9] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#7828c8]"
                >
                  개설
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#81768c]">
              유형에 맞는 기본 카테고리가 자동 생성되며, 이후 자유롭게 수정할 수 있습니다.
            </p>
          </div>

          {/* 멤버 초대 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">👥</span>
              <label className="text-sm font-bold text-[#292238]">
                멤버 초대
              </label>
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f5d778] bg-[#fff5d6] px-3 py-2 text-sm font-bold text-[#805b10] transition hover:bg-[#ffedb5]"
            >
              💬 카카오톡 초대 링크 복사
            </button>
            <p className="mt-2 text-xs text-[#81768c]">
              링크를 공유해 멤버를 초대하세요.
            </p>
          </div>
        </div>

        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed left-3 top-16 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[#f0e8f5] bg-white text-xl shadow-sm md:hidden"
          aria-label="메뉴 열기"
        >
          ☰
        </button>

        {/* 모바일 사이드바 배경 */}
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            aria-label="메뉴 닫기"
          />
        )}

        {/* 사이드바 */}
        <aside
          className={`sidebar-scrollbar-hidden group fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-[#f0e8f5] bg-white p-3 shadow-lg transition-all duration-200 md:top-16 md:h-[calc(100vh-4rem)] md:w-16 md:shadow-sm md:hover:w-56 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="mb-4 px-3 py-2 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">
            MAIN MENU
          </div>

                    <div className="mb-2 px-3 text-xs font-bold text-[#81768c] md:opacity-0 md:group-hover:opacity-100">
            가계부
          </div>

          {[
            { id: "all", label: "전체", icon: "📊", filter: "all", view: "list" },
            { id: "income", label: "수입", icon: "💰", filter: "income", view: "list" },
            { id: "fixed", label: "고정지출", icon: "🏠", filter: "fixed", view: "list" },
            { id: "variable", label: "변동지출", icon: "🛒", filter: "variable", view: "list" },
            { id: "allowance", label: "용돈", icon: "💳", filter: "allowance", view: "list" },
            { id: "saving", label: "저축", icon: "🐷", filter: "saving", view: "list" },
            { id: "year", label: "연요약", icon: "📈", view: "year" },
            { id: "budget", label: "예산", icon: "🎯", view: "budget" },
            { id: "list", label: "리스트", icon: "📋", view: "list" },
            { id: "calendar", label: "달력", icon: "📅", view: "calendar" },
          ]
            .filter((item) => item.id !== "budget" || role !== "member")
            .map((item) => {
              const active =
                mainTab === "account" &&
                (item.filter
                  ? filter === item.filter && view === "list"
                  : view === item.view);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMainTab("account");
                    if (item.filter) setFilter(item.filter);
                    if (item.view) setView(item.view as "year" | "list" | "calendar" | "budget");
                    setIsSidebarOpen(false);
                  }}
                  className={`mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${
                    active
                      ? "bg-[#f3e8ff] text-[#9145c9]"
                      : "text-[#665675] hover:bg-[#fffaff]"
                  }`}
                >
                  <span className="flex w-7 shrink-0 items-center justify-center text-lg">
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              );
            })}

          <div className="my-3 border-t border-[#f0e8f5]" />

          {[
            { id: "category", label: "카테고리 관리", icon: "📁" },
            { id: "members", label: "그룹 멤버", icon: "👥" },
            { id: "archived", label: "해체된 모임 관리", icon: "🗑️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMainTab(item.id as "category" | "members" | "archived");
                setIsSidebarOpen(false);
              }}
              className={`mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${
                mainTab === item.id
                  ? "bg-[#f3e8ff] text-[#9145c9]"
                  : "text-[#665675] hover:bg-[#fffaff]"
              }`}
            >
              <span className="flex w-7 shrink-0 items-center justify-center text-lg">
                {item.icon}
              </span>
              <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          ))}

          <div className="my-3 border-t border-[#f0e8f5]" />

          <Link
            href="/support"
            onClick={() => setIsSidebarOpen(false)}
            className="mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-[#665675] transition-all hover:bg-[#fffaff]"
          >
            <span className="flex w-7 shrink-0 items-center justify-center text-lg">💬</span>
            <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              고객지원
            </span>
          </Link>

          <Link
            href="/notices"
            onClick={() => setIsSidebarOpen(false)}
            className="mb-1 flex h-11 min-h-11 w-full shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-[#665675] transition-all hover:bg-[#fffaff]"
          >
            <span className="flex w-7 shrink-0 items-center justify-center text-lg">📢</span>
            <span className="whitespace-nowrap md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              공지사항
            </span>
          </Link>
        </aside>

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
                graphCategories={graphCategories}
                savingCategories={categorizedNames.saving}
                categories={categories}
                filteredTotal={totals.filteredTotal}
                SummaryCards={SummaryCards}
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
                darkMode={false}
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

            {mainTab === "archived" && (
              <section className="overflow-hidden rounded-2xl border border-[#f0e8f5] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">🗑️</span>
                  <h2 className="text-base font-bold text-[#292238]">해체된 모임 관리</h2>
                  <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-xs text-[#9145c9]">
                    {archivedGroups.length}
                  </span>
                </div>
                {archivedGroups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#81768c]">
                    보관 중인 모임이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {archivedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex flex-col gap-3 rounded-xl border border-[#f0e8f5] bg-[#fffaff] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-[#292238]">{group.name}</p>
                          <p className="mt-1 text-xs text-[#81768c]">
                            해체일: {group.archived_at ? new Date(group.archived_at).toLocaleDateString("ko-KR") : "날짜 정보 없음"}
                            {" · "}기존 데이터 보관 중
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-52">
                          <button
                            type="button"
                            onClick={() => restoreArchivedGroup(group)}
                            className="min-h-10 rounded-lg bg-[#9145c9] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#7828c8]"
                          >
                            다시 불러오기
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTargetGroup(group);
                              setDeleteGroupNameInput("");
                            }}
                            className="min-h-10 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            영구 삭제
                          </button>
                          {deleteTargetGroup?.id === group.id && (
                            <div className="space-y-2 rounded-lg border border-red-200 bg-white p-3">
                              <p className="text-xs leading-5 text-red-600">
                                모임과 거래내역·예산·카테고리·멤버 정보가 모두 삭제되며 복구할 수 없습니다.
                              </p>
                              <label className="block text-xs font-semibold text-[#665675]">
                                계속하려면 모임명 <span className="font-bold text-[#292238]">{group.name}</span> 입력
                              </label>
                              <input
                                type="text"
                                value={deleteGroupNameInput}
                                onChange={(event) => setDeleteGroupNameInput(event.target.value)}
                                placeholder="모임명 정확히 입력"
                                className="min-h-10 w-full rounded-lg border border-[#e6dce9] px-3 py-2 text-sm outline-none focus:border-red-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={deleteGroupNameInput !== group.name}
                                  onClick={() => permanentlyDeleteArchivedGroup(group)}
                                  className="min-h-9 flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  영구 삭제 확인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTargetGroup(null);
                                    setDeleteGroupNameInput("");
                                  }}
                                  className="min-h-9 rounded-lg border border-[#e6dce9] px-3 py-2 text-xs font-semibold text-[#665675]"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-[#81768c]">
                  영구 삭제는 되돌릴 수 없습니다. 삭제 전 모임명을 정확히 입력해야 합니다.
                </p>
              </section>
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
        darkMode={false}
        duplicateItem={duplicateItem}
        duplicateIndex={duplicateIndex}
        duplicateTotal={duplicateTotal}
        duplicateResolve={duplicateResolve}
        setDuplicateItem={setDuplicateItem}
      />
    </main>
  );
}
