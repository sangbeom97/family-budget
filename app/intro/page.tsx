import type { Metadata } from "next";
import IntroPage from "@/components/IntroPage";

export const metadata: Metadata = {
  title: "Jellian | 우리 둘의 돈 관리, 함께 시작해요",
  description:
    "신혼부부와 커플을 위한 공동 가계부 Jellian. 수입과 지출을 함께 기록하고 예산과 소비 흐름을 확인해 보세요.",
};

export default function IntroRoute() {
  return <IntroPage />;
}
