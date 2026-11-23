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

    try {
      const { error } = await supabase.from("categories").insert([
        {
          name: categoryName.trim(),
          type: categoryType,
          group_id: currentGroupId,
          user_id: userId,
        },
      ]);

      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error("카테고리 추가 실패:", error);
      alert("카테고리 추가에 실패했습니다. 입력 내용을 확인하고 다시 시도해 주세요.");
    }
  };

  const deleteCategory = async (name: string) => {
    if (!currentGroupId) return;
    if (!confirm(`[${name}] 카테고리를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("group_id", currentGroupId)
        .eq("name", name);

      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error("카테고리 삭제 실패:", error);
      alert("카테고리 삭제에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const saveBudget = async (catName: string, value: string) => {
    if (!currentGroupId) return;

    const numValue = Number(value) || 0;

    try {
      const { data, error: selectError } = await supabase
        .from("budgets")
        .select("*")
        .eq("group_id", currentGroupId)
        .eq("month", selectedMonth)
        .eq("category", catName);

      if (selectError) throw selectError;

      if (data && data.length > 0) {
        const { error } = await supabase
          .from("budgets")
          .update({ amount: numValue })
          .eq("group_id", currentGroupId)
          .eq("month", selectedMonth)
          .eq("category", catName);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").insert([
          {
            group_id: currentGroupId,
            month: selectedMonth,
            category: catName,
            amount: numValue,
          },
        ]);

        if (error) throw error;
      }

      await fetchBudgets();
    } catch (error) {
      console.error("예산 저장 실패:", error);
      alert("예산 저장에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return { addCategory, deleteCategory, saveBudget };
}
