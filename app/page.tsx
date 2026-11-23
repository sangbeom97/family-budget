"use client";

import { useEffect, useState } from "react";
import MemberView from "@/components/MemberView";
import DuplicateModal from "@/components/DuplicateModal";
import CategoryManager from "@/components/CategoryManager";
import AccountView from "@/components/AccountView";
import IntroPage from "@/components/IntroPage";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import GroupManagementPanel from "@/components/GroupManagementPanel";
import AppSidebar from "@/components/AppSidebar";
import ArchivedGroupsPanel from "@/components/ArchivedGroupsPanel";
import { useGroupData } from "@/hooks/useGroupData";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { useTransactionExcel } from "@/hooks/useTransactionExcel";
import { useCategoryBudgetActions } from "@/hooks/useCategoryBudgetActions";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useBudgetAnalytics } from "@/hooks/useBudgetAnalytics";
import { useGroupRole } from "@/hooks/useGroupRole";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import { useDuplicateImportState } from "@/hooks/useDuplicateImportState";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import { useGroupManagementState } from "@/hooks/useGroupManagementState";
import { useInitialNavigation } from "@/hooks/useInitialNavigation";
import type { Item } from "@/hooks/useGroupData";

export default function Home() {
  // --- 1. 인증 및 공유 그룹 관련 상태 ---
  const { session, authLoading } = useAuthSession();
  const {
    groups, setGroups,
    archivedGroups, setArchivedGroups,
    deleteTargetGroup, setDeleteTargetGroup,
    deleteGroupNameInput, setDeleteGroupNameInput,
    loadingGroups, setLoadingGroups,
    currentGroupId, setCurrentGroupId,
    newGroupName, setNewGroupName,
    newGroupType, setNewGroupType,
  } = useGroupManagementState();

  // --- 2. 일반 가계부 상태 정의 ---
    const [mainTab, setMainTab] = useState<
    "account" | "category" | "members" | "archived"
  >("account");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState("all");
  const [view, setView] = useState<"list" | "year" | "budget" | "calendar">("list");

  const {
    editingId, setEditingId,
    name, setName,
    memo, setMemo,
    amount, setAmount,
    type, setType,
    category, setCategory,
    spendType, setSpendType,
    date, setDate,
  } = useTransactionForm();

  const {
    filter, setFilter,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    startDate, setStartDate,
    endDate, setEndDate,
  } = useTransactionFilters();

  const [selectedFileName, setSelectedFileName] = useState("");

  const {
    items,
    loadingItems,
    yearlyItems,
    categories,
    groupMembers,
    budgets,
    refreshTransactionData,
    fetchCategories,
    fetchBudgets,
  } = useGroupData({ currentGroupId, selectedMonth, selectedYear });

  const { categoryName, setCategoryName, categoryType, setCategoryType } = useCategoryForm();

  const {
    duplicateItem,
    setDuplicateItem,
    duplicateResolve,
    setDuplicateResolve,
    duplicateIndex,
    setDuplicateIndex,
    duplicateTotal,
    setDuplicateTotal,
  } = useDuplicateImportState();

  const {
    fetchUserGroups,
    createGroup,
    restoreArchivedGroup,
    permanentlyDeleteArchivedGroup,
    handleCopyInviteLink,
  } = useGroupManagement({
    userId: session?.user?.id,
    currentGroupId,
    newGroupName,
    newGroupType,
    deleteGroupNameInput,
    setGroups,
    setArchivedGroups,
    setCurrentGroupId,
    setLoadingGroups,
    setNewGroupName,
    setNewGroupType,
    setDeleteTargetGroup,
    setDeleteGroupNameInput,
  });

  useInitialNavigation({ setMainTab, setFilter, setView });

  const role = useGroupRole(currentGroupId, session?.user?.id);

  const {
    categorizedNames, graphCategories, isRealExpense, periodFilteredItems,
    categoryData, yearlyCategoryData, totals, budgetCompareData,
    variableBudgetTotal, remainVariableBudget, monthlyData, topCategories,
  } = useBudgetAnalytics({
    categories, type, spendType, filter, selectedCreator, items, yearlyItems,
    view, search, categoryFilter, startDate, endDate, selectedYear, budgets,
  });

  useEffect(() => {
    if (categorizedNames.current.length > 0 && !categorizedNames.current.includes(category)) {
      setCategory(categorizedNames.current[0]);
    }
  }, [categorizedNames.current.join(","), category]);

  const { addItem, deleteItem, startEdit } = useTransactionActions({
    name,
    amount,
    type,
    category,
    date,
    spendType,
    memo,
    currentGroupId,
    userId: session?.user?.id,
    editingId,
    currentCategories: categorizedNames.current,
    setEditingId,
    setName,
    setAmount,
    setType,
    setCategory,
    setSpendType,
    setDate,
    setMemo,
    refreshTransactionData,
  });

  // --- 7. 카테고리 및 예산 액션 핸들러 ---
  const {
    addCategory: createCategory,
    deleteCategory,
    saveBudget,
  } = useCategoryBudgetActions({
    currentGroupId,
    userId: session?.user?.id,
    selectedMonth,
    fetchCategories,
    fetchBudgets,
  });

  const addCategory = async () => {
    if (!categoryName.trim() || !currentGroupId) return;
    await createCategory(categoryName, categoryType);
    setCategoryName("");
  };

  const { handleFileUpload, exportToExcel } = useTransactionExcel({
    currentGroupId,
    userId: session?.user?.id,
    selectedMonth,
    items,
    setSelectedFileName,
    setDuplicateItem,
    setDuplicateResolve,
    setDuplicateIndex,
    setDuplicateTotal,
    refreshTransactionData,
  });

  // --- 8. 미인증 상태 UI (소셜 로그인 전용 화면) ---
  if (authLoading) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      로딩중...
    </main>
  );
}

  if (!session) return <IntroPage />;

  // --- 9. 메인 레이아웃 렌더링 ---
  return (
    <main className="min-h-screen bg-[#fffaff] px-3 pt-16 pb-4 text-[#292238] sm:px-5 sm:py-6 md:px-6 md:pl-20">
      <div className="mx-auto w-full max-w-6xl">
        <AnnouncementPopup />
        

        
        {/* 공유 가계부 관리 패널 */}
        <GroupManagementPanel
          groups={groups}
          currentGroupId={currentGroupId}
          setCurrentGroupId={setCurrentGroupId}
          newGroupType={newGroupType}
          setNewGroupType={setNewGroupType}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          createGroup={createGroup}
          handleCopyInviteLink={handleCopyInviteLink}
        />

        <AppSidebar
          mainTab={mainTab}
          setMainTab={setMainTab}
          filter={filter}
          setFilter={setFilter}
          view={view}
          setView={setView}
          role={role}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* 컨텐츠 조건부 뷰 출력 */}
        {loadingGroups ? (
  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#f0e8f5] bg-white shadow-sm">
    <div className="text-sm font-semibold text-[#81768c]">
      불러오는 중...
    </div>
  </div>
) : !currentGroupId && mainTab === "account" ? (
          <div className="rounded-2xl border border-dashed border-[#d9e0e8] bg-white px-4 py-20 text-center shadow-sm sm:py-24">
  <span className="mb-4 block text-5xl">🏠</span>
  <p className="text-lg font-bold text-[#292238]">
    활성화된 가계부 방이 존재하지 않습니다.
  </p>
  <p className="mt-2 text-sm leading-6 text-[#81768c]">
    상단에서 새 가계부를 개설하거나 다른 가계부에 초대받아야 내역 관리가 가능합니다.
  </p>
</div>
        ) : (
          <>
            {mainTab === "account" && (
              <AccountView
                categoryData={categoryData}
                yearlyCategoryData={yearlyCategoryData}
                budgetCompareData={budgetCompareData}
                handleFileUpload={handleFileUpload}
                selectedFileName={selectedFileName}
                exportToExcel={exportToExcel}
                periodFilteredItems={periodFilteredItems}
                loadingItems={loadingItems}
                groupMembers={groupMembers}
                selectedCreator={selectedCreator}
                setSelectedCreator={setSelectedCreator}
                deleteItem={deleteItem}
                startEdit={startEdit}
                monthlyData={monthlyData}
                topCategories={topCategories}
                items={items}
                budgets={budgets}
                saveBudget={saveBudget}
                isRealExpense={isRealExpense}
                mainTab={mainTab}
                filter={filter}
                view={view}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                search={search}
                setSearch={setSearch}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                graphCategories={graphCategories}
                savingCategories={categorizedNames.saving}
                categories={categories}
                filteredTotal={totals.filteredTotal}
                incomeTotal={totals.incomeTotal}
                yearlyIncome={totals.yearlyIncome}
                expenseTotal={totals.expenseTotal}
                yearlyExpense={totals.yearlyExpense}
                savingTotal={totals.savingTotal}
                yearlySaving={totals.yearlySaving}
                total={totals.total}
                yearlyTotal={totals.yearlyTotal}
                variableBudgetTotal={variableBudgetTotal}
                remainVariableBudget={remainVariableBudget}
                name={name}
                setName={setName}
                memo={memo}
                setMemo={setMemo}
                amount={amount}
                setAmount={setAmount}
                date={date}
                setDate={setDate}
                type={type}
                setType={setType}
                category={category}
                setCategory={setCategory}
                spendType={spendType}
                setSpendType={setSpendType}
                currentCategories={categorizedNames.current}
                addItem={addItem}
                editingId={editingId}
                role={role}
              />
            )}

            {mainTab === "category" && (
              <CategoryManager
                categoryName={categoryName}
                setCategoryName={setCategoryName}
                categoryType={categoryType}
                setCategoryType={setCategoryType}
                addCategory={addCategory}
                fixedCategories={categorizedNames.fixed}
                variableCategories={categorizedNames.variable}
                allowanceCategories={categorizedNames.allowance}
                savingCategories={categorizedNames.saving}
                incomeCategories={categorizedNames.income}
                deleteCategory={deleteCategory}
              />
            )}

            {mainTab === "archived" && (
              <ArchivedGroupsPanel
                archivedGroups={archivedGroups}
                deleteTargetGroup={deleteTargetGroup}
                setDeleteTargetGroup={setDeleteTargetGroup}
                deleteGroupNameInput={deleteGroupNameInput}
                setDeleteGroupNameInput={setDeleteGroupNameInput}
                restoreArchivedGroup={restoreArchivedGroup}
                permanentlyDeleteArchivedGroup={permanentlyDeleteArchivedGroup}
              />
            )}

            {mainTab === "members" && (
  <MemberView
    currentGroupId={currentGroupId}
    role={role}
    onLeave={async () => {
      await fetchUserGroups();
      setMainTab("account");
    }}
  />
)}
          </>
        )}
      </div>

      <DuplicateModal
        duplicateItem={duplicateItem}
        duplicateIndex={duplicateIndex}
        duplicateTotal={duplicateTotal}
        duplicateResolve={duplicateResolve}
        setDuplicateItem={setDuplicateItem}
      />
    </main>
  );
}
