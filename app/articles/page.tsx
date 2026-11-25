import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "./content";

export const metadata: Metadata = {
  title: "부부 생활비 관리 팁과 가계부 작성법 | 젤리안",
  description: "신혼부부와 맞벌이 부부를 위한 생활비 분담, 공동통장, 고정지출 체크리스트와 가계부 작성 팁을 확인하세요.",
  alternates: { canonical: "https://www.jellian.com/articles" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.jellian.com/articles",
    siteName: "Jellian",
    title: "부부 생활비 관리 팁과 가계부 작성법 | 젤리안",
    description: "부부가 함께 생활비를 관리하는 데 도움이 되는 실용적인 가이드를 모았습니다."
  }
};

export default function ArticlesPage() {
  return (
    <main className="min-h-screen bg-[#fffaff] px-5 py-12 text-[#292238] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="inline-flex rounded-full border border-[#f0dafa] bg-white px-4 py-2 text-xs font-extrabold tracking-wide text-[#9145c9]">JELLIAN · MONEY GUIDE</p>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">부부 생활비 관리 가이드</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#71677d] sm:text-base">
          생활비를 어떻게 나눌지, 공동통장은 어떻게 운영할지, 매달 반복되는 지출은 무엇인지.
          신혼부부와 맞벌이 부부가 함께 돈 관리 기준을 세울 수 있도록 실용적인 내용을 정리했습니다.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <article key={article.slug} className="rounded-3xl border border-[#f0e8f5] bg-white p-6 shadow-[0_8px_30px_rgba(100,60,120,0.05)]">
              <p className="text-xs font-extrabold text-[#a14bd3]">{article.category}</p>
              <h2 className="mt-3 text-lg font-extrabold leading-7">
                <Link href={`/articles/${article.slug}`} className="hover:text-[#9145c9]">{article.title}</Link>
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#81768c]">{article.description}</p>
              <Link href={`/articles/${article.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#9145c9] hover:underline">
                내용 읽어보기 <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-3xl bg-white p-6 text-center">
          <h2 className="text-xl font-extrabold">함께 기록하고 싶은 부부라면</h2>
          <p className="mt-2 text-sm leading-6 text-[#81768c]">젤리안에서 수입과 지출, 월별 예산을 한곳에 기록하고 함께 확인해 보세요.</p>
          <Link href="/couple-budget" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-6 py-3 text-sm font-bold text-white">부부 공동 가계부 알아보기</Link>
        </div>
      </div>
    </main>
  );
}
