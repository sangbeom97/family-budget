"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";
import CategoryChart from "@/components/CategoryChart";
import MemberView from "@/components/MemberView";
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
  // --- 1. 인증 및 공유 그룹 관련 상태 ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] =
    useState(true);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [role, setRole] = useState("member");
  const [newGroupName, setNewGroupName] = useState("");

  // 🎯 진짜 초대 코드(invite_code)를 저장할 상태 추가
  const [currentInviteCode, setCurrentInviteCode] = useState<string>("");

  // --- 2. 일반 가계부 상태 정의 ---
  const [mainTab, setMainTab] = useState<
    "account" | "category" | "members"
  >("account");
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

  // --- 3. 인증 및 세션 제어 흐름 ---
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          setSession(data.session);
        } else {
          setSession(null);
        }

      } else {
        setSession(null);
      }

      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("AUTH EVENT =", _event);
        
        setSession(session);

        if (session?.user) {
          await supabase
            .from("profiles")
            .upsert({
              id: session.user.id,
              email: session.user.email,
              nickname:
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0],
            });

          const pendingInvite =
            localStorage.getItem("pendingInvite");

          if (pendingInvite) {
            localStorage.removeItem("pendingInvite");
            window.location.href = pendingInvite;
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  console.log("SESSION EFFECT =", session);

  if (session) {
    console.log("CALL FETCH USER GROUPS");

    fetchUserGroups().catch((e) => {
      console.error("fetchUserGroups ERROR =", e);
    });
  }
}, [session]);

  // 구글 로그인 핸들러 함수
  const handleGoogleSignIn = async () => {
    const pendingInvite = localStorage.getItem("pendingInvite");

    const redirectUrl = pendingInvite
      ? pendingInvite
      : window.location.origin;

    console.log("REDIRECT URL =", redirectUrl);

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

  const handleSignOut = async () => {
    localStorage.removeItem("currentGroupId");

    await supabase.auth.signOut();

    setCurrentGroupId("");
    setCurrentInviteCode("");
    setGroups([]);
  };

  // --- 4. 그룹 및 공유 관리 비즈니스 로직 ---
  const fetchUserGroups = async () => {
    console.log("FETCH USER GROUPS START");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingGroups(false);
      return;
    }
    setLoadingGroups(true);

    console.log("FETCH USER GROUPS START");
    console.log("SESSION", session);
    console.log("BEFORE QUERY");

    console.log("QUERY START");

    const { data, error } = await supabase
  .from("group_members")
  .select(`
    group_id,
    groups (
      id,
      name
    )
  `)
  .eq("user_id", user.id);

console.log("GROUP DATA =", data);
console.log("GROUP ERROR =", error);

if (error) {
  setLoadingGroups(false);
  return;
}

const mappedGroups =
  data
    ?.map((item: any) => item.groups)
    .filter(Boolean) || [];

    console.log("MAPPED GROUPS =", mappedGroups);

    setGroups(mappedGroups);

    const savedGroupId =
      localStorage.getItem("currentGroupId");

    if (
      savedGroupId &&
      mappedGroups.some((g: any) => g.id === savedGroupId)
    ) {
      setCurrentGroupId(savedGroupId);
    } else {
      const firstGroupId = mappedGroups[0]?.id || "";

      setCurrentGroupId(firstGroupId);

      if (firstGroupId) {
        localStorage.setItem(
          "currentGroupId",
          firstGroupId
        );
      }
    }

    setLoadingGroups(false);
    console.log(
      "RESTORED GROUP =",
      localStorage.getItem("currentGroupId")
    );
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
    const { data: newGroup } = await supabase
      .from("groups")
      .insert([{ name: newGroupName, created_by: session?.user?.id }])
      .select()
      .single();

    if (newGroup) {
      await supabase.from("group_members").insert([{ group_id: newGroup.id, user_id: session?.user?.id }]);
      setNewGroupName("");
      await fetchUserGroups();
      setCurrentGroupId(newGroup.id);
    }
  };

  // 🎯 원클릭 초대링크 생성 및 카카오톡 복사 핸들러 함수
  const handleCopyInviteLink = () => {
    if (!currentInviteCode) {
      alert("현재 가계부 방에 설정된 초대 코드가 없습니다. Supabase groups 테이블에 코드를 채워주세요!");
      return;
    }

    const domain = typeof window !== "undefined" ? window.location.origin : "";
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
      user_id: session?.user?.id,
      group_id: currentGroupId,
    };

    if (editingId) {
      await supabase.from("transactions").update(payload).eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("transactions").insert([payload]);
    }

    setName("");
    setAmount("");
    setMemo("");
    fetchItems();
    fetchYearlyItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm("정말 이 내역을 삭제하시겠습니까?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    fetchItems();
    fetchYearlyItems();
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

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !currentGroupId) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const parsedItems = data.map((row: any) => {
        const rawAmount = String(row["금액"] || "").replace(/[^0-9-]/g, "");
        const parsedAmount = Number(rawAmount);

        return {
          name: row["내역명"] || row["항목"] || "미지정",
          amount: isNaN(parsedAmount) ? 0 : parsedAmount,
          type: row["타입"] === "수입" ? "income" : "expense",
          category: row["카테고리"] || "기타",
          date: row["날짜"] || new Date().toISOString().split("T")[0],
          spend_type: row["지출분류"] || "variable",
          memo: row["메모"] || "",
          group_id: currentGroupId,
          user_id: session?.user?.id,
        };
      });

      if (parsedItems.length > 0) {
        await supabase.from("transactions").insert(parsedItems);
        fetchItems();
        fetchYearlyItems();
        alert(`${parsedItems.length}건의 내역을 업로드했습니다.`);
      }
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

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-700 text-center">
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-slate-900 dark:text-white">📊 무계획 속 계획</h2>
          <p className="text-center text-xs text-gray-400 dark:text-gray-400 mb-8 font-medium">우리 집, 모임 지출을 투명하게 공유하고 관리하세요.</p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 rounded-xl bg-white text-slate-700 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2"
          >
            <span>G</span> 구글 계정으로 시작하기
          </button>
        </div>
      </main>
    );
  }

  // --- 9. 메인 레이아웃 렌더링 ---
  return (
    <main className={`min-h-screen p-4 md:p-6 ${darkMode ? "bg-slate-900 text-white" : "bg-zinc-200 text-black"}`}>
      <div className="max-w-6xl mx-auto">
        {/* 탑 유저 패널 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">무계획 속 계획</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">내 유저 ID: {session.user.id}</p>
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

        {/* 공유 컨트롤 패널 바 */}
        <div className={`p-4 rounded-2xl border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">현재 활성화된 공유 가계부</label>
            <select
              value={currentGroupId}
              onChange={(e) => {
                setCurrentGroupId(e.target.value);
                localStorage.setItem("currentGroupId", e.target.value);
              }} className="w-full border-2 rounded-xl px-3 py-2 text-sm bg-transparent border-gray-200 dark:border-slate-600 font-bold outline-none text-black dark:text-white">
              {groups.length === 0 && <option value="">소속된 방이 없습니다</option>}
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">새 공유 가계부 만들기</label>
            <div className="flex gap-2">
              <input type="text" placeholder="방 이름 (예: 부부 가계부)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full border-2 rounded-xl px-3 py-1.5 text-sm bg-transparent border-gray-200 dark:border-slate-600 outline-none text-black dark:text-white" />
              <button onClick={createGroup} className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap">개설</button>
            </div>
          </div>

          {/* 🎯 [구조 변경 완료] 수동 UUID 초대창 대신 원클릭 카카오톡 링크 초대 버튼으로 완성 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">가계부 멤버 간편 초대</label>
            <button
              onClick={handleCopyInviteLink}
              className="w-full py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 text-sm font-black rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 border border-yellow-300"
            >
              💬 카카오톡 초대 링크 복사
            </button>
          </div>
        </div>

        {/* 메인 메뉴 탭 링크 */}
        <div className="flex gap-2 mb-6">
          {["category", "account", "members"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab as any)}
              className={`px-4 py-2 rounded-xl border font-medium shadow-sm ${mainTab === tab ? "bg-black text-white" : "bg-white/95 text-gray-800 border-gray-300"
                }`}
            >
              {tab === "category"
                ? "카테고리관리"
                : tab === "account"
                  ? "가계부"
                  : "그룹멤버"}
            </button>
          ))}
        </div>

        {/* 컨텐츠 조건부 뷰 출력 */}
        {loadingGroups ? (
          <div className="text-center py-20">
            불러오는 중...
          </div>
        ) : !currentGroupId && mainTab === "account" ? (
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

            {mainTab === "members" && (
              <MemberView
                currentGroupId={currentGroupId}
                role={role}
              />
            )}
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
