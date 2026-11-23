"use client";

import type { Dispatch, SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/hooks/useGroupData";

type UseTransactionActionsOptions = {
  name: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  spendType: string;
  memo: string;
  currentGroupId: string;
  userId?: string;
  editingId: number | null;
  currentCategories: string[];
  setEditingId: Dispatch<SetStateAction<number | null>>;
  setName: Dispatch<SetStateAction<string>>;
  setAmount: Dispatch<SetStateAction<string>>;
  setType: Dispatch<SetStateAction<string>>;
  setCategory: Dispatch<SetStateAction<string>>;
  setSpendType: Dispatch<SetStateAction<string>>;
  setDate: Dispatch<SetStateAction<string>>;
  setMemo: Dispatch<SetStateAction<string>>;
  refreshTransactionData: () => void;
};

export function useTransactionActions({
  name,
  amount,
  type,
  category,
  date,
  spendType,
  memo,
  currentGroupId,
  userId,
  editingId,
  currentCategories,
  setEditingId,
  setName,
  setAmount,
  setType,
  setCategory,
  setSpendType,
  setDate,
  setMemo,
  refreshTransactionData,
}: UseTransactionActionsOptions) {
  const addItem = async () => {
    if (!name.trim() || !amount.trim() || !currentGroupId) return;

    const finalCategory = category || currentCategories[0] || "기타";

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

    try {
      if (editingId !== null) {
        // 수정 시 최초 작성자(user_id)는 변경하지 않습니다.
        const { error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from("transactions").insert([{
          ...payload,
          user_id: userId,
        }]);

        if (error) throw error;
      }

      setName("");
      setAmount("");
      setMemo("");
      refreshTransactionData();
    } catch (error) {
      console.error("거래내역 저장 실패:", error);
      alert("거래내역 저장에 실패했습니다. 입력 내용을 확인하고 다시 시도해 주세요.");
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("정말 이 내역을 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("거래내역 삭제 실패:", error);
      alert("거래내역 삭제에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

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

  return { addItem, deleteItem, startEdit };
}
