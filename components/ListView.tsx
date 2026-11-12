
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
    <div className="rounded-2xl border border-[#e9edf2] bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#191f28]">
          내역 목록
        </h3>
        <span className="text-xs font-medium text-[#8b95a1]">
          총 {items.length}건
        </span>
      </div>

            <div className="space-y-3">
        {loadingItems ? (
          <div className="rounded-xl bg-[#f7f8fa] py-12 text-center">
            <span className="mb-2 block text-3xl">⏳</span>
            <p className="text-sm font-medium text-[#4e5968]">
              내역을 불러오는 중입니다
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-[#f7f8fa] py-12 text-center">
            <span className="mb-2 block text-3xl">📭</span>
            <p className="text-sm font-medium text-[#4e5968]">
              내역이 없습니다
            </p>
            <p className="mt-1 text-xs text-[#8b95a1]">
              선택한 기간에 등록된 거래 내역이 없습니다.
            </p>
          </div>
        ) : (
          items.map((item) => (
            기존 거래 카드 코드 전체
          ))
        )}
      </div>
    </div>
  );
}
