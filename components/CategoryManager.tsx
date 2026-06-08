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
      color: "text-blue-500",
      bg: "bg-blue-100",
      categories: fixedCategories,
    },
    {
      title: "변동지출",
      color: "text-red-500",
      bg: "bg-red-100",
      categories: variableCategories,
    },
    {
      title: "용돈",
      color: "text-orange-500",
      bg: "bg-orange-100",
      categories: allowanceCategories,
    },
    {
      title: "저축",
      color: "text-green-500",
      bg: "bg-green-100",
      categories: savingCategories,
    },
    {
      title: "수입",
      color: "text-purple-500",
      bg: "bg-purple-100",
      categories: incomeCategories,
    },
  ];

  return (
    <div
      className={`p-6 rounded-2xl shadow-md ${
        darkMode
          ? "bg-slate-800 text-white"
          : "bg-white/95 text-black"
      }`}
    >
      <h2 className="text-3xl font-extrabold mb-6">
        카테고리 관리
      </h2>

      {/* 추가 영역 */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          value={categoryName}
          onChange={(e) =>
            setCategoryName(e.target.value)
          }
          placeholder="카테고리명"
          className="border px-4 py-2 rounded-xl text-black"
        />

        <select
          value={categoryType}
          onChange={(e) =>
            setCategoryType(e.target.value)
          }
          className="border px-4 py-2 rounded-xl text-black"
        >
          <option value="fixed">고정지출</option>
          <option value="variable">변동지출</option>
          <option value="allowance">용돈</option>
          <option value="saving">저축</option>
          <option value="income">수입</option>
        </select>

        <button
          onClick={addCategory}
          className="px-5 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
        >
          추가
        </button>
      </div>

      {/* 카테고리 */}
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h3
              className={`text-2xl font-extrabold mb-4 ${section.color}`}
            >
              {section.title}
            </h3>

            <div className="flex flex-wrap gap-3">
              {section.categories.map((category) => (
                <div
                  key={category}
                  className={`${section.bg} px-5 py-2 rounded-full font-bold flex items-center gap-2 text-black`}
                >
                  <span>{category}</span>

                  <button
                    onClick={() =>
                      deleteCategory(category)
                    }
                    className="text-red-500 text-xl leading-none hover:scale-110 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}