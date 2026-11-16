
import { useMemo } from "react";

type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
  user_id?: string;
};

type GroupMember = {
  id: string;
  nickname: string;
};

const CATEGORY_STYLES = [
  { keywords: ["식비", "음식", "외식", "카페", "간식"], icon: "🍽️", color: "#E9A36F" },
  { keywords: ["교통", "차량", "주유", "주차", "택시"], icon: "🚗", color: "#6397D2" },
  { keywords: ["쇼핑", "생활용품", "의류", "패션"], icon: "🛍️", color: "#A78BCE" },
  { keywords: ["문화", "여가", "여행", "취미", "운동"], icon: "🎟️", color: "#5BAE91" },
  { keywords: ["의료", "건강", "병원", "약국"], icon: "💊", color: "#D9788B" },
  { keywords: ["주거", "월세", "관리비", "공과금"], icon: "🏠", color: "#8D9BCB" },
  { keywords: ["통신", "인터넷"], icon: "📱", color: "#5CAAB5" },
  { keywords: ["보험"], icon: "🛡️", color: "#8C9A70" },
  { keywords: ["교육", "육아", "학원"], icon: "📚", color: "#D39B59" },
  { keywords: ["저축", "적금", "투자"], icon: "🐷", color: "#D78AAE" },
  { keywords: ["급여", "월급", "수입", "이자"], icon: "💰", color: "#8D78C8" },
];

const FALLBACK_COLORS = ["#7E91B8", "#9A83B8", "#6D9E91", "#C28B70", "#729FB5"];

function getCategoryStyle(category: string, type: string) {
  if (type === "income") {
    return { icon: "💰", color: "#8D78C8" };
  }

  const normalized = category.replace(/\\s/g, "").toLowerCase();
  const matched = CATEGORY_STYLES.find((style) =>
    style.keywords.some((keyword) => normalized.includes(keyword.replace(/\\s/g, "").toLowerCase()))
  );

  if (matched) return { icon: matched.icon, color: matched.color };

  const hash = Array.from(category).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    icon: "📁",
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
  };
}

type Props = {
  items: Item[];
  loadingItems: boolean;
  groupMembers: GroupMember[];
  deleteItem: (id: number) => void;
  startEdit: (item: Item) => void;
  role: string;
};

export default function ListView({
  items,
  loadingItems,
  groupMembers,
  deleteItem,
  startEdit,
  role,
}: Props) {
  const creatorNameById = useMemo(
    () => new Map(groupMembers.map((member) => [member.id, member.nickname])),
    [groupMembers]
  );

  return (
    <div className="rounded-2xl border border-[#f0e8f5] bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#292238]">
          내역 목록
        </h3>
        <span className="text-xs font-medium text-[#81768c]">
          총 {items.length}건
        </span>
      </div>

            <div className="space-y-3">
        {loadingItems ? (
          <div className="rounded-xl bg-[#fffaff] py-12 text-center">
            <span className="mb-2 block text-3xl">⏳</span>
            <p className="text-sm font-medium text-[#665675]">
              내역을 불러오는 중입니다
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-[#fffaff] py-12 text-center">
            <span className="mb-2 block text-3xl">📭</span>
            <p className="text-sm font-medium text-[#665675]">
              내역이 없습니다
            </p>
            <p className="mt-1 text-xs text-[#81768c]">
              선택한 기간에 등록된 거래 내역이 없습니다.
            </p>
          </div>
                ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#f0e8f5] bg-white p-3 shadow-sm transition-all hover:border-[#d5e3f7] hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="break-words text-sm font-bold text-[#292238]">
                  {item.name}
                </p>

                {item.memo && (
                  <p className="break-words text-xs text-[#81768c]">
                    📝 {item.memo}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(() => {
                    const categoryStyle = getCategoryStyle(item.category, item.type);
                    return (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                          style={{
                            backgroundColor: `${categoryStyle.color}1A`,
                            color: categoryStyle.color,
                          }}
                          aria-hidden="true"
                        >
                          {categoryStyle.icon}
                        </span>
                        <span className="font-semibold" style={{ color: categoryStyle.color }}>
                          {item.type === "income" ? "수입" : item.category}
                        </span>
                      </span>
                    );
                  })()}

                  <span className="text-[#81768c]">{item.date}</span>

                  <span className="text-[#d1d6dc]">·</span>

                  <span className="text-[#81768c]">
                    {item.user_id
                      ? creatorNameById.get(item.user_id) || "이름 없음"
                      : "기록 없음"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f7f0fa] pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <p
                  className={`whitespace-nowrap text-base font-extrabold tracking-tight ${
                    item.type === "income"
                      ? "text-[#9145c9]"
                      : "text-[#e45d94]"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"} ₩
                  {Number(item.amount).toLocaleString()}
                </p>

                {role !== "member" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="min-h-9 rounded-lg border border-[#f0e8f5] bg-white px-3 py-1.5 text-xs font-semibold text-[#665675] transition-colors hover:bg-[#f7f0fa]"
                    >
                      수정
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="min-h-9 rounded-lg bg-[#fff0f0] px-3 py-1.5 text-xs font-semibold text-[#e5484d] transition-colors hover:bg-[#ffe3e3]"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
