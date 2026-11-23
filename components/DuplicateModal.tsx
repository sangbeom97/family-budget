"use client";

import type { DuplicateItemState } from "@/hooks/useTransactionExcel";

type Props = {
  duplicateItem: DuplicateItemState | null;
  duplicateIndex: number;
  duplicateTotal: number;
  duplicateResolve: ((add: boolean) => void) | null;
  setDuplicateItem: (item: DuplicateItemState | null) => void;
};

export default function DuplicateModal({
  duplicateItem,
  duplicateIndex,
  duplicateTotal,
  duplicateResolve,
  setDuplicateItem,
}: Props) {
  if (!duplicateItem) return null;

  const resolve = (add: boolean) => {
    duplicateResolve?.(add);
    setDuplicateItem(null);
  };

  const renderItem = (title: string, item: Pick<DuplicateItemState["newItem"], "name" | "amount" | "date">) => (
    <div className="mb-3 rounded-xl border p-3">
      <p className="font-bold">{title}</p>
      <p>{item.date}</p>
      <p>{item.name}</p>
      <p>₩{Number(item.amount).toLocaleString()}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[450px] rounded-2xl bg-white p-6 text-black shadow-xl">
        <h2 className="mb-2 text-xl font-bold">중복 가능 거래 발견</h2>

        <p className="mb-2 text-sm text-gray-500">
          {duplicateIndex} / {duplicateTotal}
        </p>

        <p className="mb-4 text-sm leading-relaxed">
          기존 거래내역과 동일한 거래로 의심됩니다.
          <br />
          그래도 새 거래로 추가하시겠습니까?
        </p>

        {renderItem("추가하려는 데이터", duplicateItem.newItem)}
        {renderItem("이미 존재하는 데이터", duplicateItem.oldItem)}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => resolve(true)}
            className="flex-1 rounded-xl bg-blue-500 py-2 text-white"
          >
            중복이어도 추가
          </button>
          <button
            type="button"
            onClick={() => resolve(false)}
            className="flex-1 rounded-xl bg-gray-300 py-2 text-black"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
