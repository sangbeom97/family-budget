"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useGroupRole(currentGroupId: string, userId?: string) {
  const [role, setRole] = useState("member");

  useEffect(() => {
    const fetchRole = async () => {
      if (!currentGroupId || !userId) return;

      const { data } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", currentGroupId)
        .eq("user_id", userId)
        .single();

      if (data) {
        setRole(data.role);
      }
    };

    fetchRole();
  }, [currentGroupId, userId]);

  return role;
}
