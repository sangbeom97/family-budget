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

    const { data } = await supabase
      .from("group_members")
      .select(`
        user_id
      `)
      .eq("group_id", currentGroupId);

    setMembers(data || []);
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
            {member.user_id}
          </div>
        ))}
      </div>
    </div>
  );
}