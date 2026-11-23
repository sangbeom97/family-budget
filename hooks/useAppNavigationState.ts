import { useState } from "react";

export type MainTab = "account" | "category" | "members" | "archived";
export type AccountViewMode = "list" | "year" | "budget" | "calendar";

export function useAppNavigationState() {
  const [mainTab, setMainTab] = useState<MainTab>("account");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState("all");
  const [view, setView] = useState<AccountViewMode>("list");

  return {
    mainTab,
    setMainTab,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedCreator,
    setSelectedCreator,
    view,
    setView,
  };
}
