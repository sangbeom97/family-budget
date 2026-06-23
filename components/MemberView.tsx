"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
    currentGroupId: string;
    role: string;
};

export default function MemberView({
    currentGroupId,
    role,
}: Props) {
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
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

        fetchMembers();
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow">
            <h2 className="text-xl font-bold mb-4">
                그룹 멤버
            </h2>

            <div className="space-y-2">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="border rounded-xl p-3"
                    >
                        <div className="font-semibold">
                            {member.nickname}
                        </div>

                        <div className="text-sm text-gray-500">
                            {member.email}
                        </div>

                        <div className="mt-2">
                            {role === "owner" ? (
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
                                    className="border rounded-lg px-2 py-1 text-sm"
                                >
                                    <option value="owner">
                                        👑 모임장
                                    </option>

                                    <option value="admin">
                                        🛠 운영진
                                    </option>

                                    <option value="member">
                                        👤 모임원
                                    </option>
                                </select>
                            ) : (
                                <div className="text-sm font-medium">
                                    {member.role === "owner"
                                        ? "👑 모임장"
                                        : member.role === "admin"
                                            ? "🛠 운영진"
                                            : "👤 모임원"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}