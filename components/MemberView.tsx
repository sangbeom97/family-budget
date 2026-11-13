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

    useEffect(() => {
    const fetchCurrentUser = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id || "");
    };

    fetchCurrentUser();
    fetchMembers();
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

        const currentUserRole =
    members.find((member) => member.id === currentUserId)?.role || role;

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

// 다른 멤버 강제퇴장
const removeMember = async (userId: string, nickname: string) => {
    if (currentUserRole !== "owner") {
        alert("모임장만 멤버를 강제퇴장할 수 있습니다.");
        return;
    }

    if (!confirm(`${nickname}님을 그룹에서 내보내시겠습니까?`)) return;

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

        const ids = memberRows.map((m) => m.user_id);

        const { data: profileRows } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids);

        const merged = (profileRows || []).map((profile) => {
            const memberInfo = memberRows.find(
                (m) => m.user_id === profile.id
            );

            return {
                ...profile,
                role: memberInfo?.role || "member",
            };
        });

        setMembers(merged);
    };

    const updateRole = async (
        userId: string,
        newRole: string,
        currentRole: string
    ) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (
            user?.id === userId &&
            currentRole === "owner" &&
            newRole !== "owner"
        ) {
            alert("모임장은 자기 자신을 강등할 수 없습니다.");
            return;
        }

        const { error } = await supabase
            .from("group_members")
            .update({
                role: newRole,
            })
            .eq("group_id", currentGroupId)
            .eq("user_id", userId);

        if (error) {
    alert(error.message);
    return;
}

// 다른 멤버에게 모임장 권한을 넘기면
// 기존 모임장은 일반 모임원으로 변경
if (newRole === "owner" && user?.id !== userId) {
    const { error: transferError } = await supabase
        .from("group_members")
        .update({ role: "member" })
        .eq("group_id", currentGroupId)
        .eq("user_id", user.id);

    if (transferError) {
        alert(`새 모임장은 지정했지만 기존 모임장 권한 변경에 실패했습니다: ${transferError.message}`);
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

                <span className="rounded-full bg-[#f2f4f6] px-3 py-1.5 text-xs font-bold text-[#4e5968]">
                    {members.length}명
                </span>
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

                        {currentUserRole === "owner" && (
                            <div className="w-full shrink-0 sm:w-36">
                                <label className="mb-1.5 block text-xs font-semibold text-[#8b95a1]">
                                    멤버 권한
                                </label>

                                <select
                                    value={member.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value;

                                        if (
                                            !confirm(
                                                `${member.nickname}님의 역할을 ${newRole}로 변경하시겠습니까?`
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
