"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useGroupRole(currentGroupId: string, userId?: string) {
  const [role, setRole] = useState("member");

  useEffect(() => {
    let isActive = true;

    const fetchRole = async () => {
      setRole("member");

      if (!currentGroupId || !userId) return;

      const { data, error } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", currentGroupId)
        .eq("user_id", userId)
        .single();

      if (!isActive) return;

      if (error) {
        console.error("모임 권한 조회 실패:", error);
        return;
      }

      setRole(data?.role || "member");
    };

    void fetchRole();

    return () => {
      isActive = false;
    };
  }, [currentGroupId, userId]);

  return role;
}
