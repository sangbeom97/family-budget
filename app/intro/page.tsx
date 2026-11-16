import type { Metadata } from "next";
import IntroPage from "@/components/IntroPage";

export const metadata: Metadata = {
  title: "Jellian | 함께 쓰는 돈, 함께 관리하는 가계부",
  description:
    "커플, 가족, 동아리, 소모임을 위한 공유 가계부 Jellian. 여러 사람이 함께 수입과 지출을 기록하고 관리해 보세요.",
};

export default function IntroRoute() {
  return <IntroPage />;
}
