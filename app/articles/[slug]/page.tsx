import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "../content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return {};
  const url = `https://www.jellian.com/articles/${article.slug}`;
  return {
    title: article.title + " | 젤리안",
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      url,
      siteName: "Jellian",
      title: article.title + " | 젤리안",
      description: article.description
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#fffaff] px-5 py-10 text-[#292238] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#8c8195]">
          <Link href="/" className="hover:text-[#9145c9]">홈</Link><span aria-hidden="true">/</span>
          <Link href="/articles" className="hover:text-[#9145c9]">생활비 관리 가이드</Link><span aria-hidden="true">/</span>
          <span className="text-[#665675]">{article.category}</span>
        </nav>
        <header className="rounded-3xl border border-[#f0e8f5] bg-white p-6 shadow-[0_8px_30px_rgba(100,60,120,0.05)] sm:p-9">
          <p className="text-xs font-extrabold tracking-wide text-[#a14bd3]">{article.category} · JELLIAN GUIDE</p>
          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-5 text-sm leading-7 text-[#71677d] sm:text-base">{article.intro}</p>
        </header>
        <div className="mt-6 rounded-2xl border border-[#f0dafa] bg-[#fff7fb] p-5">
          <h2 className="font-extrabold">이 글에서 확인할 내용</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#665675] sm:grid-cols-2">
            {article.sections.map((section) => <li key={section.heading}>· {section.heading}</li>)}
          </ul>
        </div>
        <div className="mt-7 space-y-5">
          {article.sections.map((section) => (
            <section key={section.heading} className="rounded-3xl border border-[#f0e8f5] bg-white p-6 shadow-[0_8px_30px_rgba(100,60,120,0.04)] sm:p-8">
              <h2 className="text-xl font-extrabold leading-snug">{section.heading}</h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-8 text-[#665675] sm:text-base">{paragraph}</p>)}
              </div>
              {section.bullets && (
                <ul className="mt-5 space-y-2 rounded-2xl bg-[#fffaff] p-5">
                  {section.bullets.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#665675]"><span className="font-black text-[#a14bd3]">✓</span><span>{item}</span></li>)}
                </ul>
              )}
              {section.note && <p className="mt-4 text-xs leading-6 text-[#8c8195]">{section.note}</p>}
            </section>
          ))}
        </div>
        <section className="mt-7 rounded-3xl border border-[#f0e8f5] bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">우리 집 관리 기준 점검하기</h2>
          <p className="mt-2 text-sm leading-6 text-[#81768c]">아래 항목을 두 사람이 함께 확인하고, 아직 정하지 못한 기준은 대화로 정리해 보세요.</p>
          <ul className="mt-5 space-y-3">
            {article.checklist.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-[#665675]"><span className="mt-0.5 inline-flex h-5 w-5 shrink-0 rounded-md border border-[#d8c4e6]" aria-hidden="true" />{item}</li>)}
          </ul>
        </section>
        <section className="mt-7 rounded-3xl bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-6 py-9 text-center text-white">
          <h2 className="text-xl font-black">합의한 기준을 함께 기록해 보세요.</h2>
          <p className="mt-3 text-sm leading-7 text-white/90">젤리안에서 부부가 같은 가계부를 보고 수입과 지출, 예산을 함께 관리할 수 있습니다.</p>
          <Link href="/couple-budget" className="mt-5 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-[#9235d7]">부부 공동 가계부 알아보기</Link>
        </section>
        <div className="mt-8 flex flex-wrap justify-between gap-3 text-sm font-bold text-[#9145c9]">
          <Link href="/articles" className="hover:underline">← 생활비 관리 가이드</Link>
          <Link href="/couple-budget" className="hover:underline">젤리안 서비스 보기 →</Link>
        </div>
        <p className="mt-8 border-t border-[#eee5f3] pt-5 text-xs leading-6 text-[#9a90a3]">
          이 콘텐츠는 일반적인 가계부 작성과 생활비 관리 방법을 안내하기 위한 자료입니다. 실제 분담 방식과 금액은 각 가정의 소득, 지출, 계약 및 생활 여건에 맞춰 두 사람이 합의해 결정하세요.
        </p>
      </article>
    </main>
  );
}
