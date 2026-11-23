"use client";

import { useState } from "react";
import { getLocalMonthString } from "@/lib/dateUtils";

export function useTransactionFilters() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return {
    filter, setFilter,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    startDate, setStartDate,
    endDate, setEndDate,
  };
}
