"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

type GroupMember = {
  id: string;
  nickname: string;
};

type UseGroupDataOptions = {
  currentGroupId: string;
  selectedMonth: string;
  selectedYear: string;
};

export function useGroupData({
  currentGroupId,
  selectedMonth,
  selectedYear,
}: UseGroupDataOptions) {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [yearlyItems, setYearlyItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  const fetchItems = async () => {
    if (!currentGroupId) return;

    setLoadingItems(true);

    try {
      const startDateObj = new Date(`${selectedMonth}-01`);
      const endDateObj = new Date(
        startDateObj.getFullYear(),
        startDateObj.getMonth() + 1,
        0
      );

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
    void fetchItems();
    void fetchYearlyItems();
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
      void fetchBudgets();
      void fetchCategories();
      void fetchGroupMembers();
    } else {
      setItems([]);
      setYearlyItems([]);
      setBudgets({});
      setCategories([]);
      setGroupMembers([]);
      setLoadingItems(false);
    }
    // Fetch functions intentionally use the current group and period values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, currentGroupId]);

  return {
    items,
    loadingItems,
    yearlyItems,
    categories,
    groupMembers,
    budgets,
    refreshTransactionData,
    fetchCategories,
    fetchBudgets,
  };
}
