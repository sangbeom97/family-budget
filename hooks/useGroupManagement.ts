"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import { GROUP_CATEGORY_TEMPLATES } from "@/lib/groupCategoryTemplates";

export type Group = {
  id: string;
  name: string;
  group_type?: string;
  archived_at?: string;
};

type UseGroupManagementParams = {
  userId?: string;
  currentGroupId: string;
  newGroupName: string;
  newGroupType: string;
  deleteGroupNameInput: string;
  setGroups: Dispatch<SetStateAction<Group[]>>;
  setArchivedGroups: Dispatch<SetStateAction<Group[]>>;
  setCurrentGroupId: Dispatch<SetStateAction<string>>;
  setLoadingGroups: Dispatch<SetStateAction<boolean>>;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  setNewGroupType: Dispatch<SetStateAction<string>>;
  setDeleteTargetGroup: Dispatch<SetStateAction<Group | null>>;
  setDeleteGroupNameInput: Dispatch<SetStateAction<string>>;
};

export function useGroupManagement({
  userId,
  currentGroupId,
  newGroupName,
  newGroupType,
  deleteGroupNameInput,
  setGroups,
  setArchivedGroups,
  setCurrentGroupId,
  setLoadingGroups,
  setNewGroupName,
  setNewGroupType,
  setDeleteTargetGroup,
  setDeleteGroupNameInput,
}: UseGroupManagementParams) {
  const fetchUserGroups = async () => {
    if (!userId) {
      setGroups([]);
      setArchivedGroups([]);
      setCurrentGroupId("");
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);

    try {
      const { data: archivedRows, error: archivedError } = await supabase.rpc(
        "get_my_archived_groups"
      );

      if (archivedError) {
        console.error("보관된 모임 조회 실패:", archivedError);
      } else {
        setArchivedGroups((archivedRows || []) as Group[]);
      }

      const { data: memberRows, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      const groupIds = memberRows?.map((row) => row.group_id).filter(Boolean) || [];
      let groupRows: Group[] = [];

      if (groupIds.length > 0) {
        const typedGroups = await supabase
          .from("groups")
          .select("id, name, group_type")
          .in("id", groupIds)
          .is("archived_at", null);

        if (typedGroups.error) {
          const legacyGroups = await supabase
            .from("groups")
            .select("id, name")
            .in("id", groupIds)
            .is("archived_at", null);

          if (legacyGroups.error) throw legacyGroups.error;
          groupRows = (legacyGroups.data || []).map((group) => ({
            ...group,
            group_type: "custom",
          }));
        } else {
          groupRows = (typedGroups.data || []) as Group[];
        }
      }

      setGroups(groupRows);

      const savedGroupId = localStorage.getItem("currentGroupId");
      if (savedGroupId && groupRows.some((group) => group.id === savedGroupId)) {
        setCurrentGroupId(savedGroupId);
      } else {
        const firstGroupId = groupRows[0]?.id || "";
        setCurrentGroupId(firstGroupId);
        if (firstGroupId) {
          localStorage.setItem("currentGroupId", firstGroupId);
        } else {
          localStorage.removeItem("currentGroupId");
        }
      }
    } catch (error) {
      // Keep the last successfully loaded group list if a refresh fails.
      console.error("모임 목록 조회 실패:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    void fetchUserGroups();
    // Reload groups when the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const restoreArchivedGroup = async (group: Group) => {
    if (!confirm(`"${group.name}" 모임을 다시 불러올까요?\n\n기존 거래내역·예산·카테고리가 그대로 복구됩니다.`)) {
      return;
    }

    const { error } = await supabase.rpc("restore_group", {
      p_group_id: group.id,
    });

    if (error) {
      alert(`모임 복구 실패: ${error.message}\n\nSupabase SQL Editor에서 supabase/restore_archived_groups.sql을 먼저 실행했는지 확인해주세요.`);
      return;
    }

    await fetchUserGroups();
    setCurrentGroupId(group.id);
    localStorage.setItem("currentGroupId", group.id);
    alert(`"${group.name}" 모임이 복구되었습니다.`);
  };

  const permanentlyDeleteArchivedGroup = async (group: Group) => {
    if (deleteGroupNameInput !== group.name) {
      alert("모임명이 정확히 일치하지 않습니다.");
      return;
    }

    const { error } = await supabase.rpc("delete_archived_group", {
      p_group_id: group.id,
      p_group_name: deleteGroupNameInput,
    });

    if (error) {
      alert(`모임 영구 삭제 실패: ${error.message}`);
      return;
    }

    setDeleteTargetGroup(null);
    setDeleteGroupNameInput("");
    await fetchUserGroups();
    alert(`"${group.name}" 모임과 연결된 데이터가 영구 삭제되었습니다.`);
  };

  const isCreatingGroup = useRef(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const createGroup = async () => {
    if (isCreatingGroup.current || !newGroupName.trim() || !userId) return;
    isCreatingGroup.current = true;
    setCreatingGroup(true);

    try {

    const { data: newGroup, error: groupError } = await supabase
      .from("groups")
      .insert([{
        name: newGroupName.trim(),
        group_type: newGroupType,
        created_by: userId,
        invite_code: crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(),
      }])
      .select()
      .single();

    if (groupError) {
      alert(`가계부 생성 실패: ${groupError.message}\n\n가계부 유형 기능을 사용하려면 Supabase에 group_type 컬럼 추가 SQL을 먼저 실행해주세요.`);
      return;
    }
    if (!newGroup) return;

    const { error: memberError } = await supabase.from("group_members").insert([{
      group_id: newGroup.id,
      user_id: userId,
      role: "owner",
    }]);

    if (memberError) {
      // 모임장 등록에 실패한 경우 방금 만든 빈 모임만 정리해 고아 데이터를 방지합니다.
      const { error: cleanupError } = await supabase
        .from("groups")
        .delete()
        .eq("id", newGroup.id)
        .eq("created_by", userId);

      if (cleanupError) {
        console.error("모임장 등록 실패 후 생성된 모임 정리 실패:", cleanupError);
        alert(
          `모임장 등록에 실패했습니다: ${memberError.message}\n\n자동 정리도 실패했습니다. 새로 생성된 모임이 남아 있을 수 있습니다. 모임 목록을 확인해주세요.`
        );
      } else {
        alert(`모임장 등록에 실패하여 생성된 모임을 정리했습니다: ${memberError.message}`);
      }
      return;
    }

    const template = GROUP_CATEGORY_TEMPLATES[newGroupType] || [];
    if (template.length > 0) {
      const { error: categoryError } = await supabase.from("categories").insert(
        template.map((item) => ({ ...item, group_id: newGroup.id, user_id: userId }))
      );
      if (categoryError) {
        console.error("기본 카테고리 일괄 생성 실패:", {
          groupId: newGroup.id,
          groupType: newGroupType,
          categoryCount: template.length,
          error: categoryError,
        });
        alert(
          `가계부는 정상적으로 생성됐지만 기본 카테고리를 추가하지 못했습니다.\n\n가계부 생성은 완료됐으므로 그대로 사용할 수 있습니다. '카테고리 관리'에서 필요한 항목을 직접 추가해주세요.\n\n오류: ${categoryError.message}`
        );
      }
    }

    setNewGroupName("");
    setNewGroupType("household");
    await fetchUserGroups();
    setCurrentGroupId(newGroup.id);
    } finally {
      isCreatingGroup.current = false;
      setCreatingGroup(false);
    }
  };

  const [currentInviteCode, setCurrentInviteCode] = useState<string>("");

  const fetchCurrentGroupInviteCode = async () => {
    if (!currentGroupId) {
      setCurrentInviteCode("");
      return;
    }

    const { data } = await supabase
      .from("groups")
      .select("invite_code")
      .eq("id", currentGroupId)
      .maybeSingle();

    setCurrentInviteCode(data?.invite_code || "");
  };

  useEffect(() => {
    void fetchCurrentGroupInviteCode();
    // The selected group determines which invite code is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId]);

  const handleCopyInviteLink = () => {
    if (!currentInviteCode) {
      alert("현재 가계부 방에 설정된 초대 코드가 없습니다. Supabase groups 테이블에 코드를 채워주세요!");
      return;
    }

    const inviteUrl = `${window.location.origin}/invite?code=${currentInviteCode}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => alert("✨ 카카오톡 초대 링크가 클립보드에 복사되었습니다!\n카톡창에 Ctrl+V로 공유해 보세요."))
        .catch(() => alert("링크 복사에 실패했습니다. 주소: " + inviteUrl));
    } else {
      alert("초대 링크 주소: " + inviteUrl);
    }
  };

  return {
    fetchUserGroups,
    createGroup,
    creatingGroup,
    restoreArchivedGroup,
    permanentlyDeleteArchivedGroup,
    handleCopyInviteLink,
  };
}
