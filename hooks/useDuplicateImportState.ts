"use client";

import { useState } from "react";

export function useDuplicateImportState() {
  const [duplicateItem, setDuplicateItem] = useState<any>(null);
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
