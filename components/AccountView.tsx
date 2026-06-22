"use client";

import React, { useMemo } from "react";
import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";
import CategoryChart from "@/components/CategoryChart";
import TransactionForm from "@/components/TransactionForm";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

type AccountViewProps = {
    categoryData: any[];
    yearlyCategoryData: any[];
    budgetCompareData: any[];
    handleFileUpload: (e: any) => void;
    selectedFileName: string;
    exportToExcel: () => void;
    periodFilteredItems: any[];
    deleteItem: (id: any) => void;
    startEdit: (item: any) => void;
    monthlyData: any[];
    topCategories: any[];
    items: any[];
    budgets: Record<string, string>;
    saveBudget: (category: string, value: string) => void;
    isRealExpense: (item: any) => boolean;
    mainTab: string;
    filter: string;
    setFilter: (v: string) => void;
    view: "year" | "list" | "calendar" | "budget";
    setView: React.Dispatch<React.SetStateAction<"year" | "list" | "calendar" | "budget">>;
    selectedYear: string;
    setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
    selectedMonth: string;
    setSelectedMonth: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    search: string;
    setSearch: (v: string) => void;
    categoryFilter: string;
    setCategoryFilter: (v: string) => void;
    darkMode: boolean;
    graphCategories: string[];
    savingCategories: string[];
    categories: any[];
    filteredTotal: number;
    SummaryCards: any;
    yearlyIncome: number;
    incomeTotal: number;
    yearlyExpense: number;
    expenseTotal: number;
    yearlySaving: number;
    savingTotal: number;
    yearlyTotal: number;
    total: number;
    variableBudgetTotal: number;
    remainVariableBudget: number;
    name: string;
    setName: (value: string) => void;
    memo: string;
    setMemo: (value: string) => void;
    amount: string;
    setAmount: (value: string) => void;
    date: string;
    setDate: (value: string) => void;
    type: string;
    setType: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    spendType: string;
    setSpendType: (value: string) => void;
    currentCategories: string[];
    addItem: () => void;
    editingId: number | null;
    role: string;
};

export default function AccountView(props: AccountViewProps) {
    const {
        mainTab, filter, setFilter, view, setView, selectedYear, setSelectedYear,
        selectedMonth, setSelectedMonth, startDate, setStartDate, endDate, setEndDate,
        search, setSearch, categoryFilter, setCategoryFilter, darkMode, graphCategories,
        savingCategories, categories, filteredTotal, SummaryCards, yearlyIncome, incomeTotal,
        yearlyExpense, expenseTotal, yearlySaving, savingTotal, yearlyTotal, total,
        categoryData, yearlyCategoryData, budgetCompareData, handleFileUpload, selectedFileName,
        exportToExcel, periodFilteredItems, deleteItem, startEdit, monthlyData, topCategories,
        items, budgets, saveBudget, isRealExpense, variableBudgetTotal, remainVariableBudget,
        name, setName, memo, setMemo, amount, setAmount, date, setDate, type, setType,
        category, setCategory, spendType, setSpendType, currentCategories, addItem, editingId, role
    } = props;

    // 스타일 설정
    const btnBaseClass = "px-4 py-2 rounded-xl whitespace-nowrap transition-all font-medium text-sm";
    const activeClass = "bg-black text-white shadow-sm";
    const inactiveClass = darkMode
        ? "bg-slate-800 border border-slate-700 text-gray-200 hover:bg-slate-700"
        : "bg-white/95 border border-gray-300 shadow-sm text-gray-800 hover:bg-gray-50";

    const inputClass = `border-2 rounded-xl px-3 py-2 ${darkMode ? "bg-slate-700 text-white border-slate-600" : "bg-white/95 text-black border-gray-300"
        }`;

    const filterTabs = [
        { id: "all", label: "전체" },
        { id: "income", label: "수입" },
        { id: "fixed", label: "고정지출" },
        { id: "variable", label: "변동지출" },
        { id: "allowance", label: "용돈" },
        { id: "saving", label: "저축" },
    ];

    const viewTabs = [
        { id: "year", label: "연요약" },
        ...(role !== "member"
            ? [{ id: "budget", label: "예산" }]
            : []),
        { id: "list", label: "리스트" },
        { id: "calendar", label: "달력" },
    ] as const;

    // 카테고리 필터 옵션 메모이제이션
    const filteredOptions = useMemo(() => {
        return graphCategories.filter((cat) => {
            if (filter === "saving") return savingCategories.includes(cat);
            if (filter === "income") return categories.some((c) => c.name === cat && c.type === "income");
            if (filter === "all") return true;
            return categories.some((c) => c.name === cat && c.type === filter);
        });
    }, [graphCategories, filter, savingCategories, categories]);

    // 기간 이동 버튼 핸들러
    const handlePageSelect = (direction: "prev" | "next") => {
        const currentDate = new Date(selectedMonth + "-01");
        const offset = direction === "prev" ? -1 : 1;

        if (view === "year") {
            currentDate.setFullYear(currentDate.getFullYear() + offset);
            setSelectedYear(currentDate.getFullYear().toString());
        } else {
            currentDate.setMonth(currentDate.getMonth() + offset);
        }
        setSelectedMonth(currentDate.toISOString().slice(0, 7));
    };

    if (mainTab !== "account") return null;

    return (
        <>
            {/* 1. 상단 내역 필터 탭 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`${btnBaseClass} ${filter === tab.id ? activeClass : inactiveClass}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 2. 보기 방식 탭 */}
            <div className="flex gap-2 mb-4">
                {viewTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() =>
                            setView(tab.id as "year" | "list" | "calendar" | "budget")
                        }
                        className={`${btnBaseClass} ${view === tab.id ? activeClass : inactiveClass}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. 기간 이동 컨테이너 */}
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => handlePageSelect("prev")} className={`${inputClass} px-3 font-bold shadow-sm`}>
                    ◀
                </button>

                {view === "year" ? (
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedMonth(`${e.target.value}-01`);
                        }}
                        className={`${inputClass} font-semibold`}
                    >
                        {Array.from({ length: 31 }, (_, i) => new Date().getFullYear() - 15 + i).map((year) => (
                            <option key={year} value={year}>{year}년</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className={`${inputClass} font-semibold`}
                    />
                )}

                <button onClick={() => handlePageSelect("next")} className={`${inputClass} px-3 font-bold shadow-sm`}>
                    ▶
                </button>
            </div>

            {/* 4. 기간 조회 전용 달력 */}
            {(view === "list" || view === "year") && (
                <div className="flex gap-2 mb-4 items-center">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>~</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className={`px-3 py-2 rounded-xl text-sm font-medium ${darkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-black"}`}
                        >
                            초기화
                        </button>
                    )}
                </div>
            )}

            {/* 기간조회 안내 */}
            {(startDate || endDate) && (
                <div className={`mb-4 rounded-xl px-3 py-2 text-sm font-medium ${darkMode ? "bg-orange-900/30 border border-orange-700 text-orange-300" : "bg-orange-50 border border-orange-200 text-orange-700"
                    }`}>
                    📅 기간조회 사용 중 (월 선택 무시)
                </div>
            )}

            {/* 5. 검색 및 카테고리 필터 바 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input
                    type="text"
                    placeholder="검색어 입력"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={inputClass}
                />

                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}>
                    <option value="all">전체 카테고리</option>
                    {filteredOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <div className={`border-2 rounded-xl px-4 py-2 flex items-center justify-between ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white/95 border-gray-300"}`}>
                    <span className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>현재 합계</span>
                    <span className="font-extrabold text-lg text-red-600">₩ {filteredTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* 6. 요약 대시보드 카드 */}
            {view !== "calendar" && (
                <SummaryCards
                    darkMode={darkMode}
                    totalIncome={view === "year" ? yearlyIncome : incomeTotal}
                    totalExpense={view === "year" ? yearlyExpense : expenseTotal}
                    totalSaving={view === "year" ? yearlySaving : savingTotal}
                    currentBalance={view === "year" ? yearlyTotal : total}
                    monthlyVariableBudget={variableBudgetTotal}
                    remainingVariableBudget={remainVariableBudget}
                />
            )}

            {/* 7. 리스트 뷰 영역 */}
            {view === "list" && (
                <div className="mt-4">
                    {filter !== "income" && (
                        <>
                            <div className={`rounded-2xl p-5 shadow-md mb-4 ${darkMode ? "bg-slate-800" : "bg-white/95"}`}>
                                <CategoryChart view={view} categoryData={categoryData} yearlyCategoryData={yearlyCategoryData} />
                            </div>

                            <div className={`rounded-2xl p-5 shadow-md mb-4 ${darkMode ? "bg-slate-800" : "bg-white/95"}`}>
                                <h3 className="font-extrabold mb-4 text-sm text-gray-800 dark:text-gray-100">예산 대비 사용 현황</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={budgetCompareData}>
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={90} />
                                            <YAxis domain={["auto", "auto"]} />
                                            <Tooltip formatter={(value) => [`₩${Number(value).toLocaleString()}`, " "]} />
                                            <Bar dataKey="남은예산">
                                                {budgetCompareData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.남은예산 >= 0 ? "#2563eb" : "#ef4444"} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    <div className={`pb-3 rounded-2xl ${darkMode ? "bg-slate-900" : "bg-transparent"}`}>
                        {role !== "member" && (
                            <TransactionForm
                                darkMode={darkMode} name={name} setName={setName} memo={memo} setMemo={setMemo}
                                amount={amount} setAmount={setAmount} date={date} setDate={setDate}
                                type={type} setType={setType} category={category} setCategory={setCategory}
                                spendType={spendType} setSpendType={setSpendType} categories={categories}
                                currentCategories={currentCategories} addItem={addItem} editingId={editingId}
                            />
                        )}

                        <div className={`mb-5 mt-4 rounded-2xl border-2 border-dashed p-6 text-center ${darkMode ? "border-slate-600 bg-slate-800" : "border-gray-300 bg-gray-50"}`}>
                            <div className="text-3xl mb-2">📊</div>
                            <h3 className="font-bold text-base mb-1">Excel 가져오기 / 내보내기</h3>
                            <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>파일을 선택하거나 기존 데이터를 내보낼 수 있습니다.</p>
                            <div className="flex justify-center gap-3">
                                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium cursor-pointer hover:bg-blue-600 transition">
                                    📁 파일 선택
                                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                                </label>
                                <button onClick={exportToExcel} className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
                                    📥 Excel 내보내기
                                </button>
                            </div>
                            <div className={`mt-3 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {selectedFileName ? <span>✅ {selectedFileName}</span> : <span>선택된 파일 없음</span>}
                            </div>
                        </div>

                        <ListView items={periodFilteredItems} deleteItem={deleteItem} startEdit={startEdit} darkMode={darkMode} />
                    </div>
                </div>
            )}

            {/* 8. 달력 뷰 영역 */}
            {view === "calendar" && (
                <CalendarView items={periodFilteredItems} selectedMonth={selectedMonth} darkMode={darkMode} />
            )}

            {/* 9. 연요약 통계 뷰 영역 */}
            {view === "year" && (
                <div className="space-y-4 mt-4">
                    {[
                        { title: "월별 지출", key: "지출", color: "#ef4444", isPercent: false },
                        { title: "월별 저축률", key: "저축률", color: "#22c55e", isPercent: true },
                        { title: "월별 소비패턴", keys: ["수입", "지출", "저축"], colors: ["#2563eb", "#ef4444", "#22c55e"], isMulti: true }
                    ].map((chart, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl shadow-md ${darkMode ? "bg-slate-800" : "bg-white/95"}`}>
                            <h3 className="font-extrabold mb-4 text-sm">{chart.title}</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData}>
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [chart.isPercent ? `${value}%` : `₩${Number(value).toLocaleString()}`, " "]} />
                                        {chart.isMulti ? (
                                            chart.keys?.map((k, i) => <Bar key={k} dataKey={k} fill={chart.colors?.[i]} />)
                                        ) : (
                                            <Bar dataKey={chart.key} fill={chart.color} />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}

                    <div className={`p-5 rounded-2xl shadow-md ${darkMode ? "bg-slate-800" : "bg-white/95"}`}>
                        <h3 className="font-extrabold mb-4 text-sm">연간 카테고리 TOP5</h3>
                        <div className="space-y-3">
                            {topCategories.map((item, index) => (
                                <div key={item.category} className="flex justify-between border-b dark:border-slate-700 pb-2 text-sm">
                                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>{index + 1}. {item.category}</span>
                                    <span className="font-extrabold text-red-500">₩ {item.total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 10. 예산 관리 뷰 영역 */}
            {view === "budget" && role !== "member" && (
                <div className="space-y-3 mt-4">
                    {graphCategories
                        .filter((cat) => !savingCategories.includes(cat))
                        .map((cat) => {
                            const sourceItems = startDate || endDate ? periodFilteredItems : items;
                            const spent = sourceItems
                                .filter((item) => item.category === cat && isRealExpense(item))
                                .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                            const budget = Number(budgets[cat] || 0);
                            const percent = budget > 0 ? (spent / budget) * 100 : 0;

                            return (
                                <div key={cat} className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{cat}</span>
                                        <span className="font-extrabold">
                                            ₩{spent.toLocaleString()} / ₩{budget.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-300 ${percent > 100 ? "bg-red-500" : "bg-blue-500"}`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between mt-3 items-center">
                                        <input
                                            type="number"
                                            value={budgets[cat] || ""}
                                            placeholder="예산 입력"
                                            onChange={(e) => saveBudget(cat, e.target.value)}
                                            className={`${inputClass} w-32 py-1 text-sm`}
                                        />
                                        <span className={`text-sm font-bold ${percent > 100 ? "text-red-500" : "text-blue-500"}`}>
                                            {Math.round(percent)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </>
    );
}
