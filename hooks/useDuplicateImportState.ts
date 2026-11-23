"use client";

import { useState } from "react";
import type { DuplicateItemState } from "@/hooks/useTransactionExcel";

export function useDuplicateImportState() {
  const [duplicateItem, setDuplicateItem] = useState<DuplicateItemState | null>(null);
  const [duplicateResolve, setDuplicateResolve] = useState<((value: boolean) => void) | null>(null);
  const [duplicateIndex, setDuplicateIndex] = useState(0);
  const [duplicateTotal, setDuplicateTotal] = useState(0);

  return {
    duplicateItem,
    setDuplicateItem,
    duplicateResolve,
    setDuplicateResolve,
    duplicateIndex,
    setDuplicateIndex,
    duplicateTotal,
    setDuplicateTotal,
  };
}
