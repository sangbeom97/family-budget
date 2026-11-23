"use client";

import { useState } from "react";

type UseCategoryFormOptions = {
  currentGroupId: string;
  createCategory: (name: string, type: string) => Promise<void>;
};

export function useCategoryForm({
  currentGroupId,
  createCategory,
}: UseCategoryFormOptions) {
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("variable");

  const addCategory = async () => {
    if (!categoryName.trim() || !currentGroupId) return;
    await createCategory(categoryName, categoryType);
    setCategoryName("");
  };

  return {
    categoryName,
    setCategoryName,
    categoryType,
    setCategoryType,
    addCategory,
  };
}
