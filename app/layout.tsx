import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header"; // 💡 1. 헤더 컴포넌트 임포트
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jellian(젤리안) - 투명한 모임 및 개인 가계부 대시보드",
  description: "엑셀 업로드로 1초 만에 회비 정산 끝! 실시간 공유와 동시 입력이 가능한 직관적인 모임·가족·공동 가계부 플랫폼",
  keywords: ["모임 가계부", "공동 가계부", "회비 가계부", "엑셀 가계부", "가계부 웹", "총무 정산", "Jellian", "젤리안"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
  <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
    <Header />

    <div className="flex-1 w-full">
      {children}
    </div>
  </body>
</html>
  );
}
