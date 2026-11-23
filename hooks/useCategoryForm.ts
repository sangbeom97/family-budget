"use client";

import { useState } from "react";

export function useCategoryForm() {
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("variable");

  return {
    categoryName,
    setCategoryName,
    categoryType,
    setCategoryType,
  };
}
