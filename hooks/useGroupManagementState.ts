"use client";

import { useState } from "react";
import type { Group } from "@/hooks/useGroupManagement";

export function useGroupManagementState() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<Group | null>(null);
  const [deleteGroupNameInput, setDeleteGroupNameInput] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [currentGroupId, setCurrentGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("household");

  return {
    groups, setGroups,
    archivedGroups, setArchivedGroups,
    deleteTargetGroup, setDeleteTargetGroup,
    deleteGroupNameInput, setDeleteGroupNameInput,
    loadingGroups, setLoadingGroups,
    currentGroupId, setCurrentGroupId,
    newGroupName, setNewGroupName,
    newGroupType, setNewGroupType,
  };
}
