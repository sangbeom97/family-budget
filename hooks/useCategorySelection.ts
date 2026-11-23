"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

export function useCategorySelection({
  categoryNames,
  category,
  setCategory,
}: {
  categoryNames: string[];
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
}) {
  useEffect(() => {
    if (categoryNames.length > 0 && !categoryNames.includes(category)) {
      setCategory(categoryNames[0]);
    }
  }, [categoryNames.join(","), category, setCategory]);
}
