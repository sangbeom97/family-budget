type Item = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
};

type Props = {
  items: Item[];
  deleteItem: (id: number) => void;
};

export default function ListView({
  items,
  deleteItem,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h3 className="font-semibold mb-3">
        최근 내역
      </h3>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm">
          아직 내역이 없습니다.
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center py-3 border-b"
        >
          <div>
            <p className="font-medium">
              {item.name}
            </p>

            <p className="text-sm text-gray-500">
              {item.category} · {item.date}
            </p>
          </div>

          <div className="text-right">
            <p
              className={
                item.type === "income"
                  ? "text-blue-500 font-semibold"
                  : "text-red-500 font-semibold"
              }
            >
              {item.type === "income"
                ? "+"
                : "-"}
              ₩
              {item.amount.toLocaleString()}
            </p>

            <button
              onClick={() =>
                deleteItem(item.id)
              }
              className="text-xs text-gray-400"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}