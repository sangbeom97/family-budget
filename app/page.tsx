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
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [role, setRole] = useState("member");
  const [newGroupName, setNewGroupName] = useState("");
  const [currentInviteCode, setCurrentInviteCode] = useState<string>("");

  // --- 2. 일반 가계부 상태 정의 ---
  const [mainTab, setMainTab] = useState<"account" | "category" | "members">("account");
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

  // --- 3. 인증 및 세션 제어 흐름 ---
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) setSession(data.session);
        else setSession(null);
      } else {
        setSession(null);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          email: session.user.email,
          nickname: session.user.user_metadata?.name || session.user.email?.split("@")[0],
        });
        const pendingInvite = localStorage.getItem("pendingInvite");
        if (pendingInvite) {
          localStorage.removeItem("pendingInvite");
          window.location.href = pendingInvite;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserGroups().catch((e) => console.error("fetchUserGroups ERROR =", e));
    }
  }, [session]);

  const handleGoogleSignIn = async () => {
    const pendingInvite = localStorage.getItem("pendingInvite");
    const redirectUrl = pendingInvite ? pendingInvite : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) alert(`구글 로그인 실패: ${error.message}`);
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
    const user = session?.user;
    if (!user) {
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);
    const { data, error } = await supabase.from("groups").select("*");
    
    if (error) {
      console.error("GROUPS ERROR =", error);
    } else {
      setGroups(data || []);
    }
    setLoadingGroups(false);
  };

// --- 5. 가계부 데이터 CRUD 비즈니스 로직 ---
  const fetchItems = async (groupId: string) => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("group_id", groupId)
      .order("date", { ascending: false });

    if (error) console.error("FETCH ITEMS ERROR =", error);
    else setItems(data || []);
  };

  const addItem = async () => {
    if (!name || !amount || !category) {
      alert("이름, 금액, 카테고리를 확인해주세요.");
      return;
    }

    const newItem = {
      name,
      amount: Number(amount),
      type,
      category,
      date,
      spend_type: spendType,
      memo,
      group_id: currentGroupId || null,
      user_id: session?.user?.id,
    };

    const { error } = await supabase.from("items").insert([newItem]);
    if (error) alert("등록 실패: " + error.message);
    else {
      setName("");
      setAmount("");
      setMemo("");
      fetchItems(currentGroupId);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
    else fetchItems(currentGroupId);
  };

  const updateItem = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("items")
      .update({ name, amount: Number(amount), type, category, date, spend_type: spendType, memo })
      .eq("id", editingId);

    if (error) alert("수정 실패: " + error.message);
    else {
      setEditingId(null);
      setName("");
      setAmount("");
      setMemo("");
      fetchItems(currentGroupId);
    }
  };

  // --- 6. 카테고리 관리 ---
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) console.error("CATEGORIES ERROR =", error);
    else setCategories(data || []);
  };

  const addCategory = async () => {
    if (!categoryName) return;
    const { error } = await supabase.from("categories").insert([
      { name: categoryName, type: categoryType, group_id: currentGroupId }
    ]);
    if (error) alert("카테고리 추가 실패: " + error.message);
    else {
      setCategoryName("");
      fetchCategories();
    }
  };

  // --- 7. 데이터 동기화 및 그룹 전환 ---
  useEffect(() => {
    if (currentGroupId) {
      fetchItems(currentGroupId);
      fetchCategories();
    }
  }, [currentGroupId]);

  const changeGroup = (id: string) => {
    setCurrentGroupId(id);
    localStorage.setItem("currentGroupId", id);
  };

// --- 8. UI 렌더링 파트 ---
  if (authLoading) return <main className="flex h-screen items-center justify-center">로딩중...</main>;

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <h1 className="text-2xl font-bold mb-6">가계부 서비스에 오신 것을 환영합니다</h1>
        <button 
          onClick={handleGoogleSignIn}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Google로 로그인하기
        </button>
      </main>
    );
  }

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors ${darkMode ? "bg-slate-900 text-white" : "bg-zinc-100 text-slate-900"}`}>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">나의 가계부</h1>
        <div className="flex gap-2">
          <select 
            value={currentGroupId} 
            onChange={(e) => changeGroup(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">개인 가계부</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded">로그아웃</button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SummaryCards items={items} />
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4 mb-4">
              <button onClick={() => setView("list")} className={view === "list" ? "font-bold underline" : ""}>목록</button>
              <button onClick={() => setView("calendar")} className={view === "calendar" ? "font-bold underline" : ""}>달력</button>
            </div>
            
            {view === "list" && (
              <ListView 
                items={items} 
                onDelete={deleteItem} 
                onEdit={(id) => {
                  const item = items.find(i => i.id === id);
                  if (item) {
                    setEditingId(id);
                    setName(item.name);
                    setAmount(item.amount.toString());
                    setCategory(item.category);
                    setDate(item.date);
                    setType(item.type);
                    setSpendType(item.spend_type);
                  }
                }} 
              />
            )}
            {view === "calendar" && <CalendarView items={items} />}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold mb-4">{editingId ? "수정하기" : "입력하기"}</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="내용" className="w-full p-2 border mb-2" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" className="w-full p-2 border mb-2" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border mb-2">
              <option value="">카테고리 선택</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border mb-4" />
            
            <button 
              onClick={editingId ? updateItem : addItem}
              className="w-full py-2 bg-green-600 text-white rounded"
            >
              {editingId ? "수정 완료" : "저장"}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
