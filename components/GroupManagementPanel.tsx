import type { Dispatch, SetStateAction } from "react";

type GroupOption = {
  id: string;
  name: string;
};

type Props = {
  groups: GroupOption[];
  currentGroupId: string;
  setCurrentGroupId: Dispatch<SetStateAction<string>>;
  newGroupType: string;
  setNewGroupType: Dispatch<SetStateAction<string>>;
  newGroupName: string;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  createGroup: () => void | Promise<void>;
  handleCopyInviteLink: () => void;
};

export default function GroupManagementPanel({
  groups,
  currentGroupId,
  setCurrentGroupId,
  newGroupType,
  setNewGroupType,
  newGroupName,
  setNewGroupName,
  createGroup,
  handleCopyInviteLink,
}: Props) {
  return (
    <>
<div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-[#f0e8f5] bg-white p-4 shadow-sm sm:p-5 md:grid-cols-3">

          {/* 현재 가계부 선택 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <label className="text-sm font-bold text-[#292238]">
                현재 가계부
              </label>
            </div>

            <select
              value={currentGroupId}
              onChange={(e) => {
                setCurrentGroupId(e.target.value);
                localStorage.setItem("currentGroupId", e.target.value);
              }}
              className="min-h-11 w-full rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm font-semibold text-[#292238] outline-none transition focus:border-[#9145c9]"
            >
              {groups.length === 0 && (
                <option value="">소속된 방이 없습니다</option>
              )}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#81768c]">
              관리할 공유 가계부를 선택하세요.
            </p>
          </div>

          {/* 새 가계부 만들기 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">➕</span>
              <label className="text-sm font-bold text-[#292238]">
                새 가계부 만들기
              </label>
            </div>

            <div className="space-y-2">
              <select
                value={newGroupType}
                onChange={(e) => setNewGroupType(e.target.value)}
                className="min-h-10 w-full rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm text-[#292238] outline-none focus:border-[#9145c9]"
              >
                <option value="household">부부·가족용</option>
                <option value="club">모임·동아리용</option>
                <option value="trip">여행·프로젝트용</option>
                <option value="custom">직접 설정</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 우리 가족 가계부"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[#f0e8f5] bg-white px-3 py-2 text-sm text-[#292238] outline-none transition placeholder:text-[#b0b8c1] focus:border-[#9145c9]"
                />
                <button
                  onClick={createGroup}
                  className="shrink-0 rounded-xl bg-[#9145c9] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#7828c8]"
                >
                  개설
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#81768c]">
              유형에 맞는 기본 카테고리가 자동 생성되며, 이후 자유롭게 수정할 수 있습니다.
            </p>
          </div>

          {/* 멤버 초대 */}
          <div className="min-w-0 rounded-xl bg-[#fffaff] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">👥</span>
              <label className="text-sm font-bold text-[#292238]">
                멤버 초대
              </label>
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f5d778] bg-[#fff5d6] px-3 py-2 text-sm font-bold text-[#805b10] transition hover:bg-[#ffedb5]"
            >
              💬 카카오톡 초대 링크 복사
            </button>
            <p className="mt-2 text-xs text-[#81768c]">
              링크를 공유해 멤버를 초대하세요.
            </p>
          </div>
        </div>
    </>
  );
}
