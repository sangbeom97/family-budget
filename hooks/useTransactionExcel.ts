"use client";

import { useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/hooks/useGroupData";

type ImportedTransaction = {
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
  group_id: string;
  user_id?: string;
};

type ExistingTransaction = {
  id?: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
};

type DuplicateItemState = {
  newItem: ImportedTransaction;
  oldItem: ExistingTransaction;
};

type UseTransactionExcelOptions = {
  currentGroupId: string;
  userId?: string;
  selectedMonth: string;
  items: Item[];
  setDuplicateItem: Dispatch<SetStateAction<any>>;
  setDuplicateResolve: Dispatch<SetStateAction<((value: boolean) => void) | null>>;
  setDuplicateIndex: Dispatch<SetStateAction<number>>;
  setDuplicateTotal: Dispatch<SetStateAction<number>>;
  refreshTransactionData: () => void;
};

export function useTransactionExcel({
  currentGroupId,
  userId,
  selectedMonth,
  items,
  setDuplicateItem,
  setDuplicateResolve,
  setDuplicateIndex,
  setDuplicateTotal,
  refreshTransactionData,
}: UseTransactionExcelOptions) {
  const [selectedFileName, setSelectedFileName] = useState("");

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

      const parsedItems: ImportedTransaction[] = data.map((row) => {
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
          user_id: userId,
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

      const knownItems: ExistingTransaction[] = (existingData || []).map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        type: item.type,
        category: item.category,
        date: item.date,
        spend_type: item.spend_type,
        memo: item.memo,
      }));

      const duplicateMatches: ({ oldItem: ExistingTransaction } | null)[] = [];

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
      const itemsToInsert: ImportedTransaction[] = [];
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
            } satisfies DuplicateItemState);
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

  return { handleFileUpload, exportToExcel, selectedFileName };
}
