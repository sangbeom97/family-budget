"use client";

import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";
import CategoryChart from "@/components/CategoryChart";
import TransactionForm from "@/components/TransactionForm";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";

type AccountViewProps = {
    categoryData: any[];
    yearlyCategoryData: any[];
    budgetCompareData: any[];

    handleFileUpload: (e: any) => void;
    selectedFileName: string;

    periodFilteredItems: any[];
    deleteItem: (id: any) => void;
    startEdit: (item: any) => void;

    monthlyData: any[];
    topCategories: any[];

    items: any[];
    budgets: Record<string, string>;

    saveBudget: (
        category: string,
        value: string
    ) => void;

    isRealExpense: (item: any) => boolean;

    mainTab: string;
    filter: string;
    setFilter: (v: string) => void;

    view: "year" | "list" | "calendar" | "budget";
    setView: React.Dispatch<
        React.SetStateAction<
            "year" | "list" | "calendar" | "budget"
        >
    >;

    selectedYear: string;
    setSelectedYear: React.Dispatch<
        React.SetStateAction<string>
    >;

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
};

export default function AccountView({
    mainTab,
    filter,
    setFilter,

    view,
    setView,

    selectedYear,
    setSelectedYear,

    selectedMonth,
    setSelectedMonth,

    startDate,
    setStartDate,

    endDate,
    setEndDate,

    search,
    setSearch,

    categoryFilter,
    setCategoryFilter,

    darkMode,

    graphCategories,
    savingCategories,
    categories,

    filteredTotal,

    SummaryCards,

    yearlyIncome,
    incomeTotal,

    yearlyExpense,
    expenseTotal,

    yearlySaving,
    savingTotal,

    yearlyTotal,
    total,

    categoryData,
    yearlyCategoryData,
    budgetCompareData,

    handleFileUpload,
    selectedFileName,

    periodFilteredItems,
    deleteItem,
    startEdit,

    monthlyData,
    topCategories,

    items,
    budgets,
    saveBudget,

    isRealExpense,

    variableBudgetTotal,
    remainVariableBudget,

    name,
    setName,

    memo,
    setMemo,

    amount,
    setAmount,

    date,
    setDate,

    type,
    setType,

    category,
    setCategory,

    spendType,
    setSpendType,

    currentCategories,

    addItem,

    editingId,

}: AccountViewProps) {
    return (
        <>
            {mainTab === "account" && (
                <>

                    {/* 탭 */}
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                        <button
                            onClick={() =>
                                setFilter("all")
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter === "all"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            전체
                        </button>

                        <button
                            onClick={() =>
                                setFilter("income")
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter === "income"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            수입
                        </button>

                        <button
                            onClick={() =>
                                setFilter(
                                    "fixed"
                                )
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter === "fixed"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            고정지출
                        </button>

                        <button
                            onClick={() =>
                                setFilter(
                                    "variable"
                                )
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter ===
                                "variable"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            변동지출
                        </button>

                        <button
                            onClick={() =>
                                setFilter(
                                    "allowance"
                                )
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter ===
                                "allowance"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            용돈
                        </button>

                        <button
                            onClick={() =>
                                setFilter(
                                    "saving"
                                )
                            }
                            className={`px-4 py-2 rounded-xl whitespace-nowrap ${filter ===
                                "saving"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            저축
                        </button>
                    </div>
                    <div className="flex gap-2 mb-4">

                        <button
                            onClick={() =>
                                setView("year")
                            }
                            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${view === "year"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            연요약
                        </button>

                        <button
                            onClick={() =>
                                setView("budget")
                            }
                            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${view === "budget"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            예산
                        </button>

                        <button
                            onClick={() =>
                                setView("list")
                            }
                            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${view === "list"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            리스트
                        </button>

                        <button
                            onClick={() =>
                                setView("calendar")
                            }
                            className={`px-4 py-2 rounded-xl border border-gray-300 shadow-sm font-medium ${view === "calendar"
                                ? "bg-black text-white"
                                : "bg-white/95 border border-gray-300 shadow-sm text-gray-800"
                                }`}
                        >
                            달력
                        </button>

                    </div>

                    <div className="flex items-center gap-2 mb-4">

                        <button
                            onClick={() => {
                                const date = new Date(
                                    selectedMonth + "-01"
                                );

                                if (view === "year") {
                                    date.setFullYear(
                                        date.getFullYear() - 1
                                    );

                                    setSelectedYear(
                                        date.getFullYear().toString()
                                    );
                                } else {
                                    date.setMonth(
                                        date.getMonth() - 1
                                    );
                                }

                                setSelectedMonth(
                                    date
                                        .toISOString()
                                        .slice(0, 7)
                                );
                            }}
                            className={`px-3 py-2 rounded-xl shadow-md ${darkMode
                                ? "bg-slate-700 text-white"
                                : "bg-white/95 text-black"
                                }`}
                        >
                            ◀
                        </button>

                        {view === "year" ? (
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(
                                        e.target.value
                                    );

                                    setSelectedMonth(
                                        `${e.target.value}-01`
                                    );
                                }}
                                className={`border-2 rounded-xl px-3 py-2 ${darkMode
                                    ? "bg-slate-700 text-white border-slate-600"
                                    : "bg-white/95 text-black border-gray-300"
                                    }`}
                            >
                                {Array.from(
                                    { length: 31 },
                                    (_, i) =>
                                        new Date().getFullYear() - 15 + i
                                ).map((year) => (
                                    <option
                                        key={year}
                                        value={year}
                                    >
                                        {year}년
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(
                                        e.target.value
                                    )
                                }
                                className={`border-2 rounded-xl px-3 py-2 ${darkMode
                                    ? "bg-slate-700 text-white border-slate-600"
                                    : "bg-white/95 text-black border-gray-300"
                                    }`}
                            />
                        )}

                        <button
                            onClick={() => {
                                const date = new Date(
                                    selectedMonth + "-01"
                                );

                                if (view === "year") {
                                    date.setFullYear(
                                        date.getFullYear() + 1
                                    );

                                    setSelectedYear(
                                        date.getFullYear().toString()
                                    );
                                } else {
                                    date.setMonth(
                                        date.getMonth() + 1
                                    );
                                }

                                setSelectedMonth(
                                    date
                                        .toISOString()
                                        .slice(0, 7)
                                );
                            }}
                            className={`px-3 py-2 rounded-xl shadow-md ${darkMode
                                ? "bg-slate-700 text-white"
                                : "bg-white/95 text-black"
                                }`}
                        >
                            ▶
                        </button>

                    </div>

                    {(view === "list" ||
                        view === "year") && (

                            <div className="flex gap-2 mb-4">

                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(
                                            e.target.value
                                        )
                                    }
                                    className={`border-2 rounded-xl px-3 py-2 ${darkMode
                                        ? "bg-slate-700 text-white border-slate-600"
                                        : "bg-white/95 text-black border-gray-300"
                                        }`}
                                />

                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) =>
                                        setEndDate(
                                            e.target.value
                                        )
                                    }
                                    className={`border-2 rounded-xl px-3 py-2 ${darkMode
                                        ? "bg-slate-700 text-white border-slate-600"
                                        : "bg-white/95 text-black border-gray-300"
                                        }`}
                                />

                                <button
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className={`px-3 py-2 rounded-xl ${darkMode
                                        ? "bg-slate-700 text-white"
                                        : "bg-gray-200 text-black"
                                        }`}
                                >
                                    초기화
                                </button>

                            </div>
                        )}

                    {(startDate || endDate) && (
                        <div
                            className={`mb-4 rounded-xl px-3 py-2 text-sm ${darkMode
                                ? "bg-orange-900/30 border border-orange-700 text-orange-300"
                                : "bg-orange-50 border border-orange-200 text-orange-700"
                                }`}
                        >
                            📅 기간조회 사용 중 (월 선택 무시)
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

                        {/* 검색 */}
                        <input
                            type="text"
                            placeholder="검색"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            className={`border-2 rounded-xl px-3 py-2 w-full placeholder:text-gray-500 ${darkMode
                                ? "bg-slate-700 text-white border-slate-600"
                                : "bg-white/95 text-black border-gray-300"
                                }`}
                        />

                        {/* 카테고리 필터 */}
                        <select
                            value={categoryFilter}
                            onChange={(e) =>
                                setCategoryFilter(
                                    e.target.value
                                )
                            }
                            className={`border-2 rounded-xl px-3 py-2 w-full ${darkMode
                                ? "bg-slate-700 text-white border-slate-600"
                                : "bg-white/95 text-black border-gray-300"
                                }`}
                        >
                            <option value="all">
                                전체 카테고리
                            </option>

                            {graphCategories
                                .filter((category) => {

                                    if (filter === "saving") {
                                        return savingCategories.includes(
                                            category
                                        );
                                    }

                                    if (filter === "income") {
                                        return categories.some(
                                            (c) =>
                                                c.name === category &&
                                                c.type === "income"
                                        );
                                    }

                                    if (filter === "all") {
                                        return true;
                                    }

                                    return categories.some(
                                        (c) =>
                                            c.name === category &&
                                            c.type === filter
                                    );
                                })
                                .map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                ))}
                        </select>

                        {/* 현재 합계 */}
                        <div
                            className={`border-2 rounded-xl px-4 py-2 flex items-center justify-between ${darkMode
                                ? "bg-slate-800 border-slate-700"
                                : "bg-white/95 border-gray-300"
                                }`}
                        >
                            <span
                                className={`text-sm font-semibold ${darkMode
                                    ? "text-gray-200"
                                    : "text-gray-700"
                                    }`}
                            >
                                현재 합계
                            </span>

                            <span className="font-extrabold text-red-600">
                                ₩
                                {filteredTotal.toLocaleString()}
                            </span>
                        </div>

                    </div>



                    {/* 카드 */}
                    {view !== "calendar" && (
                        <>
                            <SummaryCards
                                darkMode={darkMode}
                                totalIncome={
                                    view === "year"
                                        ? yearlyIncome
                                        : incomeTotal
                                }
                                totalExpense={
                                    view === "year"
                                        ? yearlyExpense
                                        : expenseTotal
                                }
                                totalSaving={
                                    view === "year"
                                        ? yearlySaving
                                        : savingTotal
                                }
                                currentBalance={
                                    view === "year"
                                        ? yearlyTotal
                                        : total
                                }
                                monthlyVariableBudget={
                                    variableBudgetTotal
                                }
                                remainingVariableBudget={
                                    remainVariableBudget
                                }
                            />

                        </>
                    )}
                    {/* 그래프 */}
                    {view === "year" &&
                        filter !== "income" && (

                            <div
                                className={`rounded-2xl p-5 shadow-md mb-4 ${darkMode
                                    ? "bg-slate-800"
                                    : "bg-white/95"
                                    }`}
                            >
                                <CategoryChart
                                    view={view}
                                    categoryData={categoryData}
                                    yearlyCategoryData={yearlyCategoryData}
                                />
                            </div>
                        )}

                    {/* 예산 그래프 */}
                    {view === "budget" &&
                        filter !== "income" && (
                            <div
                                className={`rounded-2xl p-5 shadow-md mb-4 ${darkMode
                                    ? "bg-slate-800"
                                    : "bg-white/95"
                                    }`}
                            >
                                <h3 className="font-extrabold mb-4">
                                    예산 대비 사용 현황
                                </h3>

                                <div className="h-72">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={
                                                budgetCompareData
                                            }
                                        >
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                interval={0}
                                                height={90}
                                            />
                                            <YAxis
                                                domain={[
                                                    "auto",
                                                    "auto",
                                                ]}
                                            />
                                            <Tooltip
                                                formatter={(value) => [
                                                    `₩${Number(
                                                        value
                                                    ).toLocaleString()}`,
                                                    " ",
                                                ]}
                                            />

                                            <Bar dataKey="남은예산">
                                                {budgetCompareData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                entry.남은예산 >= 0
                                                                    ? "#2563eb"
                                                                    : "#ef4444"
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    {view === "list" && (
                        <div
                            className={`pb-3 ${darkMode
                                ? "bg-slate-900"
                                : "bg-zinc-200"
                                }`}
                        >

                            <div
                                className={`mb-5 rounded-2xl border-2 border-dashed p-6 text-center ${darkMode
                                    ? "border-slate-600 bg-slate-800"
                                    : "border-gray-300 bg-gray-50"
                                    }`}
                            >
                                <div className="text-3xl mb-2">
                                    📊
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Excel 가져오기
                                </h3>

                                <p
                                    className={`text-sm mb-4 ${darkMode
                                        ? "text-gray-300"
                                        : "text-gray-500"
                                        }`}
                                >
                                    파일을 드래그하거나 클릭하여 선택하세요
                                </p>

                                <label
                                    className="
                                                inline-flex
                                                items-center
                                                gap-2
                                                px-5
                                                py-3
                                                rounded-xl
                                                bg-blue-500
                                                text-white
                                                cursor-pointer
                                                hover:bg-blue-600
                                                transition"
                                >
                                    📁 파일 선택

                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>

                                <div
                                    className={`mt-4 text-sm ${darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                        }`}
                                >
                                    {selectedFileName ? (
                                        <span>
                                            ✅ {selectedFileName}
                                        </span>
                                    ) : (
                                        <span>
                                            선택된 파일 없음
                                        </span>
                                    )}
                                </div>
                            </div>

                            <TransactionForm
                                darkMode={darkMode}

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

                                categories={categories}
                                currentCategories={currentCategories}

                                addItem={addItem}

                                editingId={editingId}
                            />

                            <ListView
                                items={periodFilteredItems}
                                deleteItem={deleteItem}
                                startEdit={startEdit}
                                darkMode={darkMode}
                            />

                        </div>
                    )}

                    {view === "calendar" && (
                        <CalendarView
                            items={periodFilteredItems}
                            selectedMonth={selectedMonth}
                            darkMode={darkMode}
                        />
                    )}

                    {view === "year" && (
                        <>
                            <div className="space-y-4">



                                {/* 월별 지출 */}
                                <div
                                    className={`p-5 rounded-2xl shadow-md ${darkMode
                                        ? "bg-slate-800"
                                        : "bg-white/95"
                                        }`}
                                >
                                    <h3 className="font-extrabold mb-4">
                                        월별 지출
                                    </h3>

                                    <div className="h-72">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={monthlyData}
                                            >
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => [
                                                        `₩${Number(
                                                            value
                                                        ).toLocaleString()}`,
                                                        " ",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="지출"
                                                    fill="#ef4444"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 월별 저축률 */}
                                <div
                                    className={`p-5 rounded-2xl shadow-md ${darkMode
                                        ? "bg-slate-800"
                                        : "bg-white/95"
                                        }`}
                                >
                                    <h3 className="font-extrabold mb-4">
                                        월별 저축률
                                    </h3>

                                    <div className="h-72">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={monthlyData}
                                            >
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => [
                                                        `${Number(
                                                            value
                                                        ).toLocaleString()}%`,
                                                        " ",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="저축률"
                                                    fill="#22c55e"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 월별 소비패턴 */}
                                <div
                                    className={`p-5 rounded-2xl shadow-md ${darkMode
                                        ? "bg-slate-800"
                                        : "bg-white/95"
                                        }`}
                                >
                                    <h3 className="font-extrabold mb-4">
                                        월별 소비패턴
                                    </h3>

                                    <div className="h-72">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={monthlyData}
                                            >
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => [
                                                        `₩${Number(
                                                            value
                                                        ).toLocaleString()}`,
                                                        " ",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="수입"
                                                    fill="#2563eb"
                                                />

                                                <Bar
                                                    dataKey="지출"
                                                    fill="#ef4444"
                                                />

                                                <Bar
                                                    dataKey="저축"
                                                    fill="#22c55e"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* TOP5 */}
                                <div
                                    className={`p-5 rounded-2xl shadow-md ${darkMode
                                        ? "bg-slate-800"
                                        : "bg-white/95"
                                        }`}
                                >
                                    <h3 className="font-extrabold mb-4">
                                        연간 카테고리 TOP5
                                    </h3>

                                    <div className="space-y-3">
                                        {topCategories.map(
                                            (item, index) => (
                                                <div
                                                    key={item.category}
                                                    className="flex justify-between border-b pb-2"
                                                >
                                                    <span>
                                                        {index + 1}.{" "}
                                                        {item.category}
                                                    </span>

                                                    <span className="font-extrabold">
                                                        ₩
                                                        {item.total.toLocaleString()}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {view === "budget" && (
                        <div className="space-y-3">
                            {graphCategories
                                .filter(
                                    (category) =>
                                        !savingCategories.includes(category)
                                )
                                .map((category) => {

                                    const sourceItems =
                                        startDate || endDate
                                            ? periodFilteredItems
                                            : items;

                                    const spent =
                                        sourceItems
                                            .filter(
                                                (item) =>
                                                    item.category ===
                                                    category &&
                                                    isRealExpense(item)
                                            )
                                            .reduce(
                                                (
                                                    sum,
                                                    item
                                                ) =>
                                                    sum +
                                                    (Number(item.amount) || 0),
                                                0
                                            );

                                    const budget =
                                        Number(
                                            budgets[
                                            category
                                            ] || 0
                                        );

                                    const percent =
                                        budget > 0
                                            ? (spent / budget) * 100
                                            : 0;

                                    return (
                                        <div
                                            key={category}
                                            className={`rounded-xl p-3 ${darkMode
                                                ? "bg-slate-700"
                                                : "bg-gray-50"
                                                }`}
                                        >

                                            <div className="flex justify-between mb-2">
                                                <span className={`font-semibold ${darkMode
                                                    ? "text-gray-200"
                                                    : "text-gray-800"
                                                    }`}>
                                                    {category}
                                                </span>

                                                <span className="font-extrabold">
                                                    ₩
                                                    {spent.toLocaleString()}
                                                    {" / "}
                                                    ₩
                                                    {Number(
                                                        budgets[
                                                        category
                                                        ] || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-3 rounded-full ${percent > 100
                                                        ? "bg-red-500"
                                                        : "bg-blue-500"
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            percent,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="flex justify-between mt-2">
                                                <input
                                                    type="number"
                                                    value={
                                                        budgets[
                                                        category
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        saveBudget(
                                                            category,
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`border-2 rounded-xl px-3 py-2 w-32 placeholder:text-gray-500 ${darkMode
                                                        ? "bg-slate-700 text-white border-slate-600"
                                                        : "bg-white/95 text-black border-gray-300"
                                                        }`}
                                                />

                                                <span className={`text-sm font-semibold ${darkMode
                                                    ? "text-gray-200"
                                                    : "text-gray-800"
                                                    }`}>
                                                    {Math.round(percent)}%
                                                </span>
                                            </div>

                                        </div>
                                    );
                                })}
                        </div>

                    )}
                </>

            )
            }
        </>
    );
}