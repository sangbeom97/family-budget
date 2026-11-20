"use client";

type Props = {
  categoryName: string;
  setCategoryName: (value: string) => void;
  categoryType: string;
  setCategoryType: (value: string) => void;
  addCategory: () => void;
  fixedCategories: string[];
  variableCategories: string[];
  allowanceCategories: string[];
  savingCategories: string[];
  incomeCategories: string[];
  deleteCategory: (name: string) => void;
};

const sections = [
  {
    title: "고정지출",
    description: "매월 정기적으로 발생하는 지출",
    color: "#9145c9",
    background: "bg-blue-50",
    categoriesKey: "fixedCategories",
  },
  {
    title: "변동지출",
    description: "생활비 및 일상 소비",
    color: "#e45d94",
    background: "bg-red-50",
    categoriesKey: "variableCategories",
  },
  {
    title: "용돈",
    description: "개인별 자유 지출",
    color: "#f59f00",
    background: "bg-orange-50",
    categoriesKey: "allowanceCategories",
  },
  {
    title: "저축",
    description: "저축 및 자산 형성",
    color: "#12b886",
    background: "bg-green-50",
    categoriesKey: "savingCategories",
  },
  {
    title: "수입",
    description: "급여 및 기타 수입",
    color: "#7950f2",
    background: "bg-purple-50",
    categoriesKey: "incomeCategories",
  },
] as const;

export default function CategoryManager({
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
  const categoryGroups: Record<(typeof sections)[number]["categoriesKey"], string[]> = {
    fixedCategories,
    variableCategories,
    allowanceCategories,
    savingCategories,
    incomeCategories,
  };

  const inputClass =
    "min-h-12 w-full rounded-xl border border-[#f0e8f5] bg-[#fffaff] px-4 py-3 text-sm text-[#292238] outline-none transition-colors focus:border-[#9145c9] focus:ring-2 focus:ring-[#9145c9]/15";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-[#292238] sm:text-2xl">
          카테고리 관리
        </h2>
        <p className="mt-1 text-sm text-[#81768c]">
          가계부에서 사용할 수입과 지출 항목을 관리합니다.
        </p>
      </div>

      <section className="rounded-2xl border border-[#f0e8f5] bg-white p-4 text-[#292238] shadow-sm sm:p-5">
        <h3 className="mb-4 text-base font-bold">새 카테고리 추가</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold text-[#81768c]">
              카테고리명
            </label>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
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
              onChange={(event) => setCategoryType(event.target.value)}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section) => {
          const categories = categoryGroups[section.categoriesKey];

          return (
            <section
              key={section.title}
              className="min-w-0 rounded-2xl border border-[#f0e8f5] bg-white p-4 text-[#292238] shadow-sm sm:p-5"
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
                  {categories.length}개
                </span>
              </div>

              <div className="flex min-h-12 flex-wrap content-start gap-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className={`flex min-h-10 max-w-full items-center gap-2 rounded-xl px-3 py-2 ${section.background}`}
                  >
                    <span className="break-all text-sm font-semibold text-[#665675]">
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

                {categories.length === 0 && (
                  <p className="py-3 text-sm text-[#81768c]">
                    등록된 카테고리가 없습니다.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
