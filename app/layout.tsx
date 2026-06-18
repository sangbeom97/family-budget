import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Jellian - 가계부",
  description: "심플하고 직관적인 나만의 자산 관리 대시보드",
  icons: {
    icon: "/favicon.ico",
  }, // 👈 여기에 중괄호('}')가 빠져있던 것을 채워 넣었습니다!
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
