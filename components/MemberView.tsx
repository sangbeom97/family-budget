"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
    currentGroupId: string;
};

export default function MemberView({
    currentGroupId,
}: Props) {
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchMembers();
    }, [currentGroupId]);

    const fetchMembers = async () => {
        if (!currentGroupId) return;

        const { data: memberRows, error } = await supabase
            .from("group_members")
            .select("user_id")
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

        setMembers(profileRows || []);
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow">
            <h2 className="text-xl font-bold mb-4">
                그룹 멤버
            </h2>

            <div className="space-y-2">
                {members.map((member, idx) => (
                    <div
                        key={idx}
                        className="border rounded-xl p-3"
                    >
                        <div className="font-semibold">
                            {member.nickname}
                        </div>

                        <div className="text-sm text-gray-500">
                            {member.email}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}