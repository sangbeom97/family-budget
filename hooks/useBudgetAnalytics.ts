"use client";

import { useMemo } from "react";
import type { Item } from "@/hooks/useGroupData";

type Category = { name: string; type: string };
type Options = {
  categories: Category[];
  type: string;
  spendType: string;
  filter: string;
  selectedCreator: string;
  items: Item[];
  yearlyItems: Item[];
  view: string;
  search: string;
  categoryFilter: string;
  startDate: string;
  endDate: string;
  selectedYear: string;
  budgets: Record<string, string>;
};

export function useBudgetAnalytics({
  categories, type, spendType, filter, selectedCreator, items, yearlyItems,
  view, search, categoryFilter, startDate, endDate, selectedYear, budgets,
}: Options) {
  const categorizedNames = useMemo(() => {
    const filterBy = (t: string) =>
      categories.filter((c) => c.type?.trim().toLowerCase() === t).map((c) => c.name);

    return {
      fixed: filterBy("fixed"),
      variable: filterBy("variable"),
      allowance: filterBy("allowance"),
      saving: filterBy("saving"),
      income: filterBy("income"),
      current: categories
        .filter((c) => c.type?.trim().toLowerCase() === (type === "income" ? "income" : spendType))
        .map((c) => c.name),
    };
  }, [categories, type, spendType]);

  const graphCategories = useMemo(() => [
    ...new Set(
      categories
        .filter((item) => filter === "all" ? item.type !== "income" : item.type === filter)
        .map((item) => item.name)
    ),
  ], [categories, filter]);

  const isRealExpense = (item: Item) => item.type === "expense" && item.spend_type !== "saving";
  const sumAmount = (list: Item[]) =>
    list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const creatorFilteredItems = useMemo(() =>
    selectedCreator === "all" ? items : items.filter((item) => item.user_id === selectedCreator),
  [items, selectedCreator]);

  const creatorFilteredYearlyItems = useMemo(() =>
    selectedCreator === "all" ? yearlyItems : yearlyItems.filter((item) => item.user_id === selectedCreator),
  [yearlyItems, selectedCreator]);

  const periodFilteredItems = useMemo(() => {
    const baseItems = (startDate || endDate)
      ? creatorFilteredYearlyItems
      : (view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems);
    const keyword = search.trim().toLowerCase();

    return baseItems.filter((item) => {
      const filterMatch = filter === "all"
        ? true
        : filter === "income"
          ? item.type === "income"
          : item.type === "expense" && item.spend_type === filter;
      const searchMatch = (item.name || "").toLowerCase().includes(keyword) ||
        (item.memo || "").toLowerCase().includes(keyword);
      const categoryMatch = categoryFilter === "all" ? true : item.category === categoryFilter;
      const startMatch = !startDate || item.date >= startDate;
      const endMatch = !endDate || item.date <= endDate;
      return filterMatch && searchMatch && categoryMatch && startMatch && endMatch;
    });
  }, [creatorFilteredItems, creatorFilteredYearlyItems, view, filter, search, categoryFilter, startDate, endDate]);

  const yearlySourceItems = creatorFilteredYearlyItems;

  const getCategoryData = (sourceList: Item[]) => graphCategories
    .filter((cat) => filter === "saving" ? categorizedNames.saving.includes(cat) : !categorizedNames.saving.includes(cat))
    .map((cat) => {
      const totalAmount = sumAmount(sourceList.filter((item) => {
        if (item.category !== cat) return false;
        if (filter === "saving") return item.spend_type === "saving";
        return isRealExpense(item) && (filter === "all" ? true : item.spend_type === filter);
      }));
      return { name: cat, value: totalAmount };
    });

  const categoryData = useMemo(() => getCategoryData(periodFilteredItems), [graphCategories, filter, categorizedNames.saving, periodFilteredItems]);
  const yearlyCategoryData = useMemo(() => getCategoryData(yearlySourceItems), [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);

  const totals = useMemo(() => {
    const inc = sumAmount(creatorFilteredItems.filter((i) => i.type === "income"));
    const exp = sumAmount(creatorFilteredItems.filter(isRealExpense));
    const sav = sumAmount(creatorFilteredItems.filter((i) => i.spend_type === "saving"));
    const yInc = sumAmount(yearlySourceItems.filter((i) => i.type === "income"));
    const yExp = sumAmount(yearlySourceItems.filter(isRealExpense));
    const ySav = sumAmount(yearlySourceItems.filter((i) => i.spend_type === "saving"));
    const filtTot = filter === "income"
      ? sumAmount(periodFilteredItems.filter((i) => i.type === "income"))
      : sumAmount(periodFilteredItems.filter(isRealExpense));
    return {
      incomeTotal: inc, expenseTotal: exp, savingTotal: sav, total: inc - exp,
      yearlyIncome: yInc, yearlyExpense: yExp, yearlySaving: ySav, yearlyTotal: yInc - yExp,
      filteredTotal: filtTot
    };
  }, [creatorFilteredItems, yearlySourceItems, periodFilteredItems, filter]);

  const budgetCompareData = useMemo(() => {
    const sourceItems = view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems;
    return graphCategories
      .filter((cat) => !categorizedNames.saving.includes(cat))
      .map((cat) => {
        const spent = sumAmount(sourceItems.filter((i) => i.category === cat && isRealExpense(i)));
        const budget = Number(budgets[cat] || 0);
        return { name: cat, 사용금액: spent, 남은예산: budget - spent };
      });
  }, [graphCategories, categorizedNames.saving, view, creatorFilteredYearlyItems, creatorFilteredItems, budgets]);

  const { variableBudgetTotal, remainVariableBudget } = useMemo(() => {
    const sourceItems = view === "year" ? creatorFilteredYearlyItems : creatorFilteredItems;
    const targets = graphCategories.filter((cat) => !categorizedNames.saving.includes(cat));
    const vBudgetTot = targets.reduce((s, cat) => s + Number(budgets[cat] || 0), 0);
    const rVariableBudget = targets.reduce((sum, cat) => {
      const spent = sumAmount(sourceItems.filter((i) => i.category === cat && isRealExpense(i)));
      const budget = Number(budgets[cat] || 0);
      return sum + (budget - spent);
    }, 0);
    return { variableBudgetTotal: vBudgetTot, remainVariableBudget: rVariableBudget };
  }, [graphCategories, categorizedNames.saving, view, creatorFilteredYearlyItems, creatorFilteredItems, budgets]);

  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const month = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
    const monthItems = yearlySourceItems.filter((item) => item.date && item.date.startsWith(month));
    const income = sumAmount(monthItems.filter((item) => item.type === "income"));
    const expense = sumAmount(monthItems.filter(isRealExpense));
    const saving = sumAmount(monthItems.filter((item) => item.spend_type === "saving"));
    return {
      month: `${i + 1}월`,
      수입: income,
      지출: expense,
      저축: saving,
      저축률: income > 0 ? Math.round((saving / income) * 100) : 0,
    };
  }), [selectedYear, yearlySourceItems]);

  const topCategories = useMemo(() => graphCategories
    .filter((cat) => filter === "saving" ? categorizedNames.saving.includes(cat) : !categorizedNames.saving.includes(cat))
    .map((cat) => {
      const total = sumAmount(yearlySourceItems.filter(
        (i) => i.category === cat && (filter === "saving" ? i.spend_type === "saving" : isRealExpense(i))
      ));
      return { category: cat, total };
    })
    .sort((a, b) => b.total - a.total)
    .filter((i) => i.total > 0)
    .slice(0, 5), [graphCategories, filter, categorizedNames.saving, yearlySourceItems]);

  return {
    categorizedNames, graphCategories, isRealExpense, creatorFilteredItems,
    creatorFilteredYearlyItems, periodFilteredItems, yearlySourceItems,
    categoryData, yearlyCategoryData, totals, budgetCompareData,
    variableBudgetTotal, remainVariableBudget, monthlyData, topCategories,
  };
}
