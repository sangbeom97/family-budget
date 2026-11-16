
"use client";

import React from "react";

type Props = {
  darkMode: boolean;
  categoryName: string;
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  categoryType: string;
  setCategoryType: React.Dispatch<React.SetStateAction<string>>;
  addCategory: () => void;

  fixedCategories: string[];
  variableCategories: string[];
  allowanceCategories: string[];
  savingCategories: string[];
  incomeCategories: string[];

  fetchCategories: () => void;
  deleteCategory: (name: string) => void;
};

export default function CategoryManager({
  darkMode,
  categoryName,
  setCategoryName,
  categoryType,
  setCategoryType,
  addCategory,
  fixedCategories,
  variableCategories,
  allowanceCategories,
  savingCategories,
  incomeCategories,
  deleteCategory,
}: Props) {
  const sections = [
    {
      title: "고정지출",
      description: "매월 정기적으로 발생하는 지출",
      color: "#9145c9",
      bg: darkMode ? "bg-[#9145c9]/10" : "bg-blue-50",
      categories: fixedCategories,
    },
    {
      title: "변동지출",
      description: "생활비 및 일상 소비",
      color: "#e45d94",
      bg: darkMode ? "bg-red-500/10" : "bg-red-50",
      categories: variableCategories,
    },
    {
      title: "용돈",
      description: "개인별 자유 지출",
      color: "#f59f00",
      bg: darkMode ? "bg-orange-500/10" : "bg-orange-50",
      categories: allowanceCategories,
    },
    {
      title: "저축",
      description: "저축 및 자산 형성",
      color: "#12b886",
      bg: darkMode ? "bg-green-500/10" : "bg-green-50",
      categories: savingCategories,
    },
    {
      title: "수입",
      description: "급여 및 기타 수입",
      color: "#7950f2",
      bg: darkMode ? "bg-purple-500/10" : "bg-purple-50",
      categories: incomeCategories,
    },
  ];

  const cardClass = darkMode
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-[#f0e8f5] text-[#292238]";

  const inputClass = `min-h-12 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[#9145c9] focus:ring-2 focus:ring-[#9145c9]/15 ${
    darkMode
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-[#fffaff] border-[#f0e8f5] text-[#292238]"
  }`;

  return (
    <div className="space-y-5">
      {/* 제목 */}
      <div>
        <h2
          className={`text-xl font-extrabold sm:text-2xl ${
            darkMode ? "text-white" : "text-[#292238]"
          }`}
        >
          카테고리 관리
        </h2>
        <p className="mt-1 text-sm text-[#81768c]">
          가계부에서 사용할 수입과 지출 항목을 관리합니다.
        </p>
      </div>

      {/* 카테고리 추가 */}
      <section className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${cardClass}`}>
        <h3 className="mb-4 text-base font-bold">
          새 카테고리 추가
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold text-[#81768c]">
              카테고리명
            </label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="예: 식비, 교통비"
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold text-[#81768c]">
              카테고리 유형
            </label>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              className={inputClass}
            >
              <option value="fixed">고정지출</option>
              <option value="variable">변동지출</option>
              <option value="allowance">용돈</option>
              <option value="saving">저축</option>
              <option value="income">수입</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addCategory}
              className="min-h-12 w-full rounded-xl bg-[#9145c9] px-6 text-sm font-bold text-white transition-colors hover:bg-[#7828c8] lg:w-auto"
            >
              + 추가하기
            </button>
          </div>
        </div>
      </section>

      {/* 카테고리 목록 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${cardClass}`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3
                  className="text-base font-extrabold"
                  style={{ color: section.color }}
                >
                  {section.title}
                </h3>
                <p className="mt-1 text-xs text-[#81768c]">
                  {section.description}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#fffaff] px-3 py-1 text-xs font-bold text-[#81768c]">
                {section.categories.length}개
              </span>
            </div>

            <div className="flex min-h-12 flex-wrap content-start gap-2">
              {section.categories.map((category) => (
                <div
                  key={category}
                  className={`flex min-h-10 max-w-full items-center gap-2 rounded-xl px-3 py-2 ${section.bg}`}
                >
                  <span
                    className={`break-all text-sm font-semibold ${
                      darkMode ? "text-slate-200" : "text-[#665675]"
                    }`}
                  >
                    {category}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    aria-label={`${category} 삭제`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base font-bold text-[#81768c] transition-colors hover:bg-red-100 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}

              {section.categories.length === 0 && (
                <p className="py-3 text-sm text-[#81768c]">
                  등록된 카테고리가 없습니다.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
