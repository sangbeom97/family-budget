
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
    currentGroupId: string;
    role: string;
    onLeave: () => Promise<void>;
};

export default function MemberView({
    currentGroupId,
    role,
    onLeave,
}: Props) {
    const [members, setMembers] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState("");

    const currentUserRole =
        members.find((member) => member.id === currentUserId)?.role || role;

    useEffect(() => {
        const initialize = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setCurrentUserId(user?.id || "");
            await fetchMembers();
        };

        initialize();
    }, [currentGroupId]);

    const fetchMembers = async () => {
        if (!currentGroupId) return;

        const { data: memberRows, error } = await supabase
            .from("group_members")
            .select("user_id, role")
            .eq("group_id", currentGroupId);

        if (error || !memberRows) {
            console.log(error);
            return;
        }

        const ids = memberRows.map((member) => member.user_id);

        const { data: profileRows, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids);

        if (profileError) {
            console.log(profileError);
            return;
        }

        const merged = (profileRows || []).map((profile) => {
            const memberInfo = memberRows.find(
                (member) => member.user_id === profile.id
            );

            return {
                ...profile,
                role: memberInfo?.role || "member",
            };
        });

        setMembers(merged);
    };

    // 그룹 탈퇴
    const leaveGroup = async () => {
        if (!currentUserId) return;

        if (currentUserRole === "owner") {
            alert("모임장 권한을 다른 멤버에게 넘긴 후 탈퇴할 수 있습니다.");
            return;
        }

        if (!confirm("정말 이 그룹에서 탈퇴하시겠습니까?")) return;

        const { error } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", currentGroupId)
            .eq("user_id", currentUserId);

        if (error) {
            alert(`그룹 탈퇴 실패: ${error.message}`);
            return;
        }

        await onLeave();
};

// 모임 해체
const archiveGroup = async () => {
    if (currentUserRole !== "owner") {
        alert("모임장만 모임을 해체할 수 있습니다.");
        return;
    }

    if (
        !confirm(
            "정말 모임을 해체하시겠습니까?\n\n모든 멤버의 가입 정보가 해제되며, 기존 거래내역·예산·카테고리는 보존됩니다."
        )
    ) {
        return;
    }

    const { error } = await supabase.rpc("archive_group", {
        p_group_id: currentGroupId,
    });

    if (error) {
        alert(`모임 해체 실패: ${error.message}`);
        return;
    }

    alert("모임이 해체되었습니다. 기존 가계부 데이터는 보존되었습니다.");
    await onLeave();
};

    // 다른 멤버 강제퇴장
    const removeMember = async (userId: string, nickname: string) => {
        if (currentUserRole !== "owner") {
            alert("모임장만 멤버를 강제퇴장할 수 있습니다.");
            return;
        }

        if (!confirm(`${nickname}님을 그룹에서 내보내시겠습니까?`)) {
            return;
        }

        const { error } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", currentGroupId)
            .eq("user_id", userId);

        if (error) {
            alert(`멤버 강제퇴장 실패: ${error.message}`);
            return;
        }

        await fetchMembers();
    };

    // 멤버 권한 변경 및 모임장 권한 이전
    const updateRole = async (
        userId: string,
        newRole: string,
        currentRole: string
    ) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        if (
            user.id === userId &&
            currentRole === "owner" &&
            newRole !== "owner"
        ) {
            alert("모임장은 다른 멤버에게 권한을 이전해야 합니다.");
            return;
        }

        if (newRole === "owner") {
            const { error } = await supabase.rpc(
                "transfer_group_ownership",
                {
                    p_group_id: currentGroupId,
                    p_new_owner_id: userId,
                }
            );

            if (error) {
                alert(`모임장 권한 이전 실패: ${error.message}`);
                return;
            }
        } else {
            const { error } = await supabase
                .from("group_members")
                .update({ role: newRole })
                .eq("group_id", currentGroupId)
                .eq("user_id", userId);

            if (error) {
                alert(error.message);
                return;
            }
        }

        await fetchMembers();
    };

    return (
        <div className="rounded-2xl border border-[#e9edf2] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-[#191f28]">
                        그룹 멤버
                    </h2>
                    <p className="mt-1 text-sm text-[#8b95a1]">
                        함께 가계부를 사용하는 멤버를 관리합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
    <span className="rounded-full bg-[#f2f4f6] px-3 py-1.5 text-xs font-bold text-[#4e5968]">
        {members.length}명
    </span>

    {currentUserRole === "owner" && (
        <button
            onClick={archiveGroup}
            className="min-h-9 rounded-lg border border-[#f3c5c5] px-3 py-1.5 text-xs font-bold text-[#d64545] transition hover:bg-[#fff1f1]"
        >
            모임 해체
        </button>
    )}
</div>
            </div>

            <div className="space-y-3">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#e9edf2] p-4 transition-colors hover:bg-[#fafbfc] sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="break-words text-sm font-bold text-[#191f28]">
                                    {member.nickname || "이름 없음"}
                                </span>

                                {member.role === "owner" && (
                                    <span className="rounded-full bg-[#fff5d6] px-2 py-1 text-xs font-bold text-[#b7791f]">
                                        👑 모임장
                                    </span>
                                )}

                                {member.role === "admin" && (
                                    <span className="rounded-full bg-[#eaf2ff] px-2 py-1 text-xs font-bold text-[#3182f6]">
                                        🛠 운영진
                                    </span>
                                )}

                                {member.role === "member" && (
                                    <span className="rounded-full bg-[#f2f4f6] px-2 py-1 text-xs font-bold text-[#8b95a1]">
                                        👤 모임원
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 break-all text-xs text-[#8b95a1]">
                                {member.email}
                            </p>
                        </div>

                        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                            {currentUserRole === "owner" && (
                                <div className="w-full sm:w-36">
                                    <label className="mb-1.5 block text-xs font-semibold text-[#8b95a1]">
                                        멤버 권한
                                    </label>

                                    <select
                                        value={member.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;

                                            if (
                                                !confirm(
                                                    `${member.nickname || "멤버"}님의 역할을 변경하시겠습니까?`
                                                )
                                            ) {
                                                return;
                                            }

                                            updateRole(
                                                member.id,
                                                newRole,
                                                member.role
                                            );
                                        }}
                                        className="min-h-10 w-full rounded-lg border border-[#e9edf2] bg-white px-3 py-2 text-sm font-semibold text-[#4e5968] outline-none focus:border-[#3182f6]"
                                    >
                                        <option value="owner">모임장</option>
                                        <option value="admin">운영진</option>
                                        <option value="member">모임원</option>
                                    </select>
                                </div>
                            )}

                            {currentUserRole === "owner" &&
                                member.id !== currentUserId &&
                                member.role !== "owner" && (
                                    <button
                                        onClick={() =>
                                            removeMember(
                                                member.id,
                                                member.nickname || "이 멤버"
                                            )
                                        }
                                        className="min-h-10 rounded-lg border border-[#f3c5c5] px-3 py-2 text-sm font-bold text-[#d64545] transition hover:bg-[#fff1f1]"
                                    >
                                        강제퇴장
                                    </button>
                                )}

                            {member.id === currentUserId &&
                                member.role !== "owner" && (
                                    <button
                                        onClick={leaveGroup}
                                        className="min-h-10 rounded-lg border border-[#e9edf2] px-3 py-2 text-sm font-bold text-[#d64545] transition hover:bg-[#fff1f1]"
                                    >
                                        그룹 탈퇴
                                    </button>
                                )}
                        </div>
                    </div>
                ))}

                {members.length === 0 && (
                    <div className="rounded-xl bg-[#f7f8fa] py-12 text-center">
                        <span className="mb-2 block text-3xl">👥</span>
                        <p className="text-sm font-semibold text-[#4e5968]">
                            등록된 멤버가 없습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
