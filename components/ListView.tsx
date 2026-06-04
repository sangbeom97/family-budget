type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
};

type Props = {
  items: Item[];
  deleteItem: (id: number) => void;
  startEdit: (item: Item) => void;
};

export default function ListView({
  items,
  deleteItem,
  startEdit,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h3 className="font-semibold mb-4 text-gray-800">
        내역 목록
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {item.name}
              </p>

              {item.memo && (
                <p className="text-sm text-gray-500">
                  📝 {item.memo}
                </p>
              )}

              <p className="text-gray-500">
                {item.type === "income"
                  ? "수입"
                  : item.category}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {item.date}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`font-bold ${
                  item.type ===
                  "income"
                    ? "text-blue-600"
                    : "text-red-500"
                }`}
              >
                {item.type ===
                "income"
                  ? "+"
                  : "-"}
                ₩
                {item.amount.toLocaleString()}
              </p>

              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() =>
                    startEdit(item)
                  }
                  className="text-sm px-3 py-1 rounded-lg bg-gray-200 text-gray-800"
                >
                  수정
                </button>

                <button
                  onClick={() =>
                    deleteItem(
                      item.id
                    )
                  }
                  className="text-sm px-3 py-1 rounded-lg bg-red-500 text-white"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            내역이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
