type Group = {
  id: string;
  name: string;
  archived_at?: string;
};

type Props = {
  archivedGroups: Group[];
  deleteTargetGroup: Group | null;
  setDeleteTargetGroup: (group: Group | null) => void;
  deleteGroupNameInput: string;
  setDeleteGroupNameInput: (value: string) => void;
  restoreArchivedGroup: (group: Group) => void | Promise<void>;
  permanentlyDeleteArchivedGroup: (group: Group) => void | Promise<void>;
};

export default function ArchivedGroupsPanel({
  archivedGroups,
  deleteTargetGroup,
  setDeleteTargetGroup,
  deleteGroupNameInput,
  setDeleteGroupNameInput,
  restoreArchivedGroup,
  permanentlyDeleteArchivedGroup,
}: Props) {
  return (
    <>
{mainTab === "archived" && (
              <section className="overflow-hidden rounded-2xl border border-[#f0e8f5] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">🗑️</span>
                  <h2 className="text-base font-bold text-[#292238]">해체된 모임 관리</h2>
                  <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-xs text-[#9145c9]">
                    {archivedGroups.length}
                  </span>
                </div>
                {archivedGroups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#81768c]">
                    보관 중인 모임이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {archivedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex flex-col gap-3 rounded-xl border border-[#f0e8f5] bg-[#fffaff] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-[#292238]">{group.name}</p>
                          <p className="mt-1 text-xs text-[#81768c]">
                            해체일: {group.archived_at ? new Date(group.archived_at).toLocaleDateString("ko-KR") : "날짜 정보 없음"}
                            {" · "}기존 데이터 보관 중
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-52">
                          <button
                            type="button"
                            onClick={() => restoreArchivedGroup(group)}
                            className="min-h-10 rounded-lg bg-[#9145c9] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#7828c8]"
                          >
                            다시 불러오기
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTargetGroup(group);
                              setDeleteGroupNameInput("");
                            }}
                            className="min-h-10 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            영구 삭제
                          </button>
                          {deleteTargetGroup?.id === group.id && (
                            <div className="space-y-2 rounded-lg border border-red-200 bg-white p-3">
                              <p className="text-xs leading-5 text-red-600">
                                모임과 거래내역·예산·카테고리·멤버 정보가 모두 삭제되며 복구할 수 없습니다.
                              </p>
                              <label className="block text-xs font-semibold text-[#665675]">
                                계속하려면 모임명 <span className="font-bold text-[#292238]">{group.name}</span> 입력
                              </label>
                              <input
                                type="text"
                                value={deleteGroupNameInput}
                                onChange={(event) => setDeleteGroupNameInput(event.target.value)}
                                placeholder="모임명 정확히 입력"
                                className="min-h-10 w-full rounded-lg border border-[#e6dce9] px-3 py-2 text-sm outline-none focus:border-red-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={deleteGroupNameInput !== group.name}
                                  onClick={() => permanentlyDeleteArchivedGroup(group)}
                                  className="min-h-9 flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  영구 삭제 확인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTargetGroup(null);
                                    setDeleteGroupNameInput("");
                                  }}
                                  className="min-h-9 rounded-lg border border-[#e6dce9] px-3 py-2 text-xs font-semibold text-[#665675]"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-[#81768c]">
                  영구 삭제는 되돌릴 수 없습니다. 삭제 전 모임명을 정확히 입력해야 합니다.
                </p>
              </section>
            )}
    </>
  );
}
