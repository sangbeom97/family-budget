import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import SupportNoticeSidebar from "@/components/SupportNoticeSidebar";
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
  metadataBase: new URL("https://www.jellian.com"),
  title: "Jellian(젤리안) - 신혼부부·부부 공동 가계부",
  description:
    "신혼부부와 맞벌이 부부를 위한 공동 가계부. 수입, 지출, 고정생활비, 저축과 월별 예산을 기록하고 함께 관리해 보세요.",
  keywords: [
    "신혼부부 가계부",
    "부부 가계부",
    "공동 가계부",
    "맞벌이 부부 가계부",
    "생활비 관리",
    "가계부 웹",
    "Jellian",
    "젤리안",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.jellian.com",
    siteName: "Jellian",
    title: "Jellian(젤리안) - 신혼부부·부부 공동 가계부",
    description:
      "부부의 수입과 지출, 생활비와 예산을 한곳에서 함께 관리하세요.",
  },
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
        <SupportNoticeSidebar />
        <div className="flex-1 w-full">{children}</div>
      </body>
    </html>
  );
}
