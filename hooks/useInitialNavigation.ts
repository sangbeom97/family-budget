"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

type MainTab = "account" | "category" | "members" | "archived";
type View = "list" | "year" | "budget" | "calendar";

export function useInitialNavigation({
  setMainTab,
  setFilter,
  setView,
}: {
  setMainTab: Dispatch<SetStateAction<MainTab>>;
  setFilter: Dispatch<SetStateAction<string>>;
  setView: Dispatch<SetStateAction<View>>;
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const menu = params.get("menu");
    const panel = params.get("panel");

    if (panel === "category" || panel === "members" || panel === "archived") {
      setMainTab(panel);
    } else if (["all", "income", "fixed", "variable", "allowance", "saving"].includes(menu || "")) {
      setMainTab("account");
      setFilter(menu || "all");
      setView("list");
    } else if (menu === "year" || menu === "budget" || menu === "list" || menu === "calendar") {
      setMainTab("account");
      setView(menu);
      if (menu === "list") setFilter("all");
    }
  }, []);
}
