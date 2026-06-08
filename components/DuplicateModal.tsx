"use client";

type TransactionItem = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  spend_type: string;
  memo: string;
};

type DuplicateItem = {
  newItem: TransactionItem;
  oldItem: TransactionItem;
};

type Props = {
  darkMode: boolean;
  duplicateItem: DuplicateItem | null;
  duplicateIndex: number;
  duplicateTotal: number;
  duplicateResolve: ((add: boolean) => void) | null;
  setDuplicateItem: (
    item: DuplicateItem | null
  ) => void;
};

export default function DuplicateModal({
  darkMode,
  duplicateItem,
  duplicateIndex,
  duplicateTotal,
  duplicateResolve,
  setDuplicateItem,
}: Props) {
  if (!duplicateItem) return null;

  return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div
  className={`rounded-2xl p-6 w-[450px] ${
    darkMode
      ? "bg-slate-800 text-white"
      : "bg-white text-black"
  }`}
>

  <h2 className="text-xl font-bold mb-2">
    중복 가능 거래 발견
  </h2>

  <p className={`text-sm mb-4 ${
    darkMode
      ? "text-gray-300"
      : "text-gray-500"
  }`}>
    {duplicateIndex} / {duplicateTotal}
  </p>

  <div className="border rounded-xl p-3 mb-3">
    <p className="font-bold">
      추가하려는 데이터
    </p>

    <p>
      {duplicateItem.newItem.date}
    </p>

    <p>
      {duplicateItem.newItem.name}
    </p>

    <p>
      ₩{duplicateItem.newItem.amount.toLocaleString()}
    </p>
  </div>

  <div className="border rounded-xl p-3 mb-4">
  <p className="font-bold">
    이미 존재하는 데이터
  </p>

  <p>
    {duplicateItem.oldItem.date}
  </p>

  <p>
    {duplicateItem.oldItem.name}
  </p>

  <p>
    ₩{duplicateItem.oldItem.amount.toLocaleString()}
  </p>
</div>

<div className="flex gap-2">

  <button
  onClick={() => {

    duplicateResolve?.(
      true
    );

    setDuplicateItem(
      null
    );

  }}
  className="flex-1 bg-blue-500 text-white rounded-xl py-2"
>
  예
</button>

  <button
  onClick={() => {

    duplicateResolve?.(
      false
    );

    setDuplicateItem(
      null
    );

  }}
  className={`flex-1 rounded-xl py-2 ${
    darkMode
      ? "bg-slate-700 text-white"
      : "bg-gray-300 text-black"
  }`}
>
  아니요
</button>

</div>

</div>

  </div>
);
}