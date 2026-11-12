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
    <div className="rounded-2xl p-5 shadow-sm border bg-white border-gray-100 text-gray-900">
      <h3 className="font-extrabold mb-4 text-sm text-gray-800">내역 목록</h3>


      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 flex justify-between items-center transition-colors bg-gray-50/50 border-gray-100 hover:bg-gray-50"
          >
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-900">{item.name}</p>

              {item.memo && (
                <p className="text-xs text-gray-500">📝 {item.memo}</p>
              )}

              <p className="text-xs font-medium text-gray-500">
                {item.type === "income" ? "수입" : item.category}
              </p>

              <p className="text-[11px] text-gray-400 font-mono">{item.date}</p>
              <p className="text-[11px] text-blue-600 font-medium">
                작성자: {item.user_id ? creatorNameById.get(item.user_id) || "이름 없음" : "기록 없음"}
              </p>
            </div>

            <div className="text-right">
              <p className={`font-extrabold text-base ${item.type === "income" ? "text-blue-500" : "text-red-500"}`}>
                {item.type === "income" ? "+" : "-"} ₩{Number(item.amount).toLocaleString()}
              </p>

              {role !== "member" && (
                <div className="flex gap-2 mt-3 justify-end">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    수정
                  </button>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12">
            <span className="text-3xl block mb-2">Empty</span>
            <p className="text-sm text-gray-400 font-medium">내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
