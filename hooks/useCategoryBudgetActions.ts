"use client";

import { supabase } from "@/lib/supabase";

type UseCategoryBudgetActionsParams = {
  currentGroupId: string;
  userId?: string;
  selectedMonth: string;
  fetchCategories: () => void | Promise<void>;
  fetchBudgets: () => void | Promise<void>;
};

export function useCategoryBudgetActions({
  currentGroupId,
  userId,
  selectedMonth,
  fetchCategories,
  fetchBudgets,
}: UseCategoryBudgetActionsParams) {
  const addCategory = async (categoryName: string, categoryType: string) => {
    if (!categoryName.trim() || !currentGroupId) return;

    await supabase.from("categories").insert([
      {
        name: categoryName.trim(),
        type: categoryType,
        group_id: currentGroupId,
        user_id: userId,
      },
    ]);

    await fetchCategories();
  };

  const deleteCategory = async (name: string) => {
    if (!currentGroupId) return;
    if (!confirm(`[${name}] 카테고리를 삭제하시겠습니까?`)) return;

    await supabase
      .from("categories")
      .delete()
      .eq("group_id", currentGroupId)
      .eq("name", name);

    await fetchCategories();
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
        {
          group_id: currentGroupId,
          month: selectedMonth,
          category: catName,
          amount: numValue,
        },
      ]);
    }

    await fetchBudgets();
  };

  return { addCategory, deleteCategory, saveBudget };
}
