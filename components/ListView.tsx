
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

type Props = {
  items: Item[];
  groupMembers: GroupMember[];
  deleteItem: (id: number) => void;
  startEdit: (item: Item) => void;
  role: string;
};

export default function ListView({
  items,
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
    <div className="rounded-2xl border border-[#e9edf2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#191f28]">
          내역 목록
        </h3>
        <span className="text-xs font-medium text-[#8b95a1]">
          총 {items.length}건
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#eef0f3] bg-white p-4 transition-colors hover:bg-[#fafbfc] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="break-words text-sm font-bold text-[#191f28]">
                {item.name}
              </p>

              {item.memo && (
                <p className="break-words text-xs text-[#8b95a1]">
                  📝 {item.memo}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8b95a1]">
                <span>{item.type === "income" ? "수입" : item.category}</span>
                <span>·</span>
                <span>{item.date}</span>
                <span>·</span>
                <span>
                  {item.user_id
                    ? creatorNameById.get(item.user_id) || "이름 없음"
                    : "기록 없음"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
              <p
                className={`whitespace-nowrap text-base font-extrabold tracking-tight ${
                  item.type === "income"
                    ? "text-[#3182f6]"
                    : "text-[#f04452]"
                }`}
              >
                {item.type === "income" ? "+" : "-"} ₩
                {Number(item.amount).toLocaleString()}
              </p>

              {role !== "member" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="min-h-9 rounded-lg border border-[#e9edf2] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e5968] transition-colors hover:bg-[#f2f4f6]"
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
        ))}

        {items.length === 0 && (
          <div className="rounded-xl bg-[#f7f8fa] py-12 text-center">
            <span className="mb-2 block text-3xl">📭</span>
            <p className="text-sm font-medium text-[#8b95a1]">
              내역이 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
