export type GroupCategoryTemplate = {
  name: string;
  type: string;
};

export const GROUP_CATEGORY_TEMPLATES: Record<string, GroupCategoryTemplate[]> = {
  household: [
    { name: "주거비", type: "fixed" },
    { name: "통신비", type: "fixed" },
    { name: "보험료", type: "fixed" },
    { name: "구독료", type: "fixed" },
    { name: "식비", type: "variable" },
    { name: "생활용품", type: "variable" },
    { name: "교통·차량", type: "variable" },
    { name: "의료·건강", type: "variable" },
    { name: "여가·문화", type: "variable" },
    { name: "육아·교육", type: "variable" },
    { name: "개인용돈", type: "allowance" },
    { name: "저축", type: "saving" },
    { name: "투자", type: "saving" },
    { name: "급여", type: "income" },
    { name: "부수입", type: "income" },
    { name: "기타수입", type: "income" },
  ],
  club: [
    { name: "정기회비", type: "income" },
    { name: "추가회비", type: "income" },
    { name: "후원금", type: "income" },
    { name: "기타수입", type: "income" },
    { name: "식비·회식", type: "variable" },
    { name: "행사비", type: "variable" },
    { name: "운영비", type: "fixed" },
    { name: "교통비", type: "variable" },
    { name: "물품구입", type: "variable" },
    { name: "기타지출", type: "variable" },
    { name: "예비비", type: "saving" },
  ],
  trip: [
    { name: "공동경비 입금", type: "income" },
    { name: "추가분담금", type: "income" },
    { name: "숙박", type: "variable" },
    { name: "교통", type: "variable" },
    { name: "식비", type: "variable" },
    { name: "관광·활동", type: "variable" },
    { name: "준비물", type: "variable" },
    { name: "기타비용", type: "variable" },
  ],
  custom: [],
};
