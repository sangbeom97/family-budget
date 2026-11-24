import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "신혼부부 공동 가계부 | 부부 생활비 함께 관리하기 - 젤리안",
  description:
    "신혼부부와 맞벌이 부부를 위한 공동 가계부 가이드. 생활비와 개인 지출을 구분하고 수입·지출, 월별 예산과 저축을 함께 관리하는 방법을 알아보세요.",
  keywords: [
    "신혼부부 가계부",
    "부부 가계부",
    "공동 가계부",
    "맞벌이 부부 가계부",
    "부부 생활비 관리",
    "신혼 생활비",
  ],
  alternates: {
    canonical: "https://www.jellian.com/couple-budget",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.jellian.com/couple-budget",
    siteName: "Jellian",
    title: "신혼부부 공동 가계부 | 젤리안",
    description:
      "두 사람의 수입과 지출, 생활비와 예산을 한곳에서 기록하고 함께 관리하는 방법을 알아보세요.",
  },
};

const topics = [
  {
    number: "01",
    title: "먼저 돈 관리 기준을 함께 정해요",
    body: "월급을 합칠지, 각자 관리할지부터 정답을 찾으려 하지 않아도 괜찮아요. 두 사람이 편하게 공개하고 합의할 수 있는 범위부터 시작해 보세요. 공동 생활비에 포함할 항목과 각자 자유롭게 사용할 금액을 구분하면 대화가 훨씬 쉬워집니다.",
    points: ["공동 생활비에 포함할 항목 정하기", "각자 부담할 지출과 함께 부담할 지출 구분하기", "매달 함께 확인할 날짜 정하기"],
  },
  {
    number: "02",
    title: "고정지출과 변동지출을 나눠 기록해요",
    body: "월세·관리비·통신비처럼 매달 반복되는 비용은 고정지출로, 식비·외식·생활용품처럼 달마다 달라지는 비용은 변동지출로 구분해 보세요. 어디에서 지출이 달라지는지 파악하기 쉬워집니다.",
    points: ["고정지출: 주거비, 관리비, 통신비, 보험료 등", "변동지출: 식비, 외식비, 장보기, 생활용품 등", "저축과 각자 용돈도 별도 항목으로 기록하기"],
  },
  {
    number: "03",
    title: "월 예산은 현실적으로 세워요",
    body: "처음부터 모든 항목의 예산을 완벽하게 정할 필요는 없어요. 최근 지출을 살펴보고 식비나 생활용품처럼 조절하고 싶은 항목부터 목표 금액을 정해 보세요. 한 달이 끝나면 실제 사용 금액과 비교해 다음 달 예산을 조정하면 됩니다.",
    points: ["최근 한두 달의 지출 흐름 살펴보기", "조절하고 싶은 카테고리부터 예산 설정하기", "예산과 실제 사용 금액을 월말에 함께 확인하기"],
  },
  {
    number: "04",
    title: "기록보다 중요한 건 함께 돌아보는 습관이에요",
    body: "가계부는 누가 더 많이 썼는지 따지는 도구가 아니라 두 사람의 생활을 함께 이해하는 기록이에요. 큰 지출이 있었던 이유와 다음 달에 바꾸고 싶은 점을 짧게 이야기해 보세요.",
    points: ["일주일에 한 번 지출 내역 확인하기", "예상하지 못한 지출은 메모 남기기", "서로의 소비를 평가하기보다 다음 계획을 합의하기"],
  },
];

const faqs = [
  {
    question: "신혼부부 가계부는 꼭 공동 통장을 사용해야 하나요?",
    answer: "꼭 그렇지는 않아요. 공동 통장을 사용하는 부부도 있고, 각자 계좌를 유지하면서 공동 생활비만 정산하는 부부도 있어요. 먼저 두 사람이 합의한 공동 지출 기준을 정하고 그 내역부터 함께 기록해 보세요.",
  },
  {
    question: "부부 가계부에는 어떤 항목을 기록하면 좋나요?",
    answer: "수입, 주거비와 공과금 같은 고정지출, 식비와 생활용품 같은 변동지출, 각자 용돈, 저축을 기본 항목으로 시작할 수 있어요. 실제 생활에 맞춰 카테고리를 추가하거나 조정하면 됩니다.",
  },
  {
    question: "두 사람이 각자 기록한 내역을 함께 볼 수 있나요?",
    answer: "젤리안은 가계부를 만든 뒤 멤버를 초대해 하나의 공유 공간에서 거래 내역과 예산, 통계를 함께 확인할 수 있도록 구성되어 있어요. 실제 이용 권한은 가계부 내 역할에 따라 달라집니다.",
  },
  {
    question: "엑셀로 관리하던 내역도 옮길 수 있나요?",
    answer: "젤리안은 Excel 거래 내역 가져오기와 내보내기를 지원해요. 업로드 과정에서 중복이 의심되는 거래가 감지되면 확인한 뒤 처리할 수 있습니다.",
  },
];

export default function CoupleBudgetPage() {
  return (
    <main className="min-h-screen bg-[#fffaff] text-[#292238]">
      <section className="relative isolate overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(210,160,255,0.24),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(255,170,198,0.25),transparent_30%),linear-gradient(180deg,#fffaff_0%,#fff_100%)]" />
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-[#f0dafa] bg-white/80 px-4 py-2 text-xs font-extrabold tracking-wide text-[#9145c9]">
            JELLIAN · COUPLE BUDGET GUIDE
          </p>
          <h1 className="mt-6 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            신혼부부 공동 가계부,
            <span className="mt-2 block bg-gradient-to-r from-[#8528e8] to-[#f34d9a] bg-clip-text text-transparent">
              둘이 함께 기록하고 함께 관리해요.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#71677d] sm:text-lg">
            결혼 후에는 주거비와 생활비부터 장보기, 외식, 저축까지 함께 의논할 돈이 많아집니다.
            부부가 같은 기준으로 수입과 지출을 기록하면 우리 집 돈의 흐름을 더 쉽게 확인할 수 있어요.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#c77be8]/25 transition hover:-translate-y-0.5">
              부부 가계부 시작하기 <span className="ml-2" aria-hidden="true">→</span>
            </Link>
            <Link href="/intro" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#eadcf3] bg-white px-7 py-3 text-sm font-bold text-[#665675] transition hover:bg-[#fcf5ff]">
              젤리안 서비스 소개
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["함께 기록", "두 사람이 같은 가계부에서 거래 내역 확인"],
              ["항목별 관리", "수입·고정지출·변동지출·용돈·저축 구분"],
              ["예산 돌아보기", "카테고리별 예산과 월별 소비 흐름 확인"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white bg-white/85 p-5 shadow-sm">
                <p className="font-extrabold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#81768c]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">START TOGETHER</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">부부 가계부, 이렇게 시작해 보세요</h2>
            <p className="mt-4 text-sm leading-7 text-[#81768c] sm:text-base">
              복잡한 규칙을 먼저 만들기보다 두 사람이 꾸준히 지킬 수 있는 작은 기준부터 정하는 것이 좋아요.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {topics.map((topic) => (
              <article key={topic.number} className="rounded-3xl border border-[#f0e8f5] bg-white p-6 shadow-[0_8px_30px_rgba(100,60,120,0.04)] sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4eaff] text-sm font-black text-[#9145c9]">{topic.number}</span>
                  <div>
                    <h2 className="text-lg font-extrabold sm:text-xl">{topic.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#71677d] sm:text-base">{topic.body}</p>
                    <ul className="mt-4 space-y-2">
                      {topic.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm leading-6 text-[#665675]">
                          <span className="font-black text-[#a14bd3]">✓</span><span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">WITH JELLIAN</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">젤리안으로 부부 공동 가계부 관리하기</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#81768c] sm:text-base">
            젤리안은 부부·가족용 가계부를 만들고 멤버를 초대해 함께 사용하는 공유 가계부 서비스입니다.
            두 사람이 필요한 항목을 기록하고 예산과 소비 흐름을 확인해 보세요.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["수입과 지출", "수입, 고정지출, 변동지출, 용돈, 저축으로 거래를 구분해 기록할 수 있어요."],
              ["월별 예산", "카테고리별 예산을 설정하고 실제 사용 금액과 비교할 수 있어요."],
              ["리스트와 달력", "거래 내역을 목록과 달력으로 살펴보고 검색과 기간 필터를 활용할 수 있어요."],
              ["연간 통계", "월별 소비 흐름과 카테고리별 지출 현황을 돌아볼 수 있어요."],
              ["멤버 초대", "가계부 초대 링크로 함께 관리할 사람을 초대할 수 있어요."],
              ["Excel 가져오기·내보내기", "기존 거래 내역을 가져오거나 기록을 파일로 보관할 수 있어요."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-[#f0e8f5] bg-[#fffaff] p-5">
                <h3 className="font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#81768c]">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-[#9a90a3]">
            거래 편집과 예산 관리 등 일부 기능은 가계부 내 역할에 따라 이용 권한이 달라집니다.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">신혼부부 가계부 자주 묻는 질문</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-[#f0e8f5] bg-white p-5 sm:p-6">
                <h3 className="font-extrabold">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#71677d]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-6 py-12 text-center text-white shadow-xl shadow-[#d18be7]/20 sm:px-12">
          <p className="text-sm font-bold text-white/80">YOUR MONEY, TOGETHER</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">우리 집 돈 관리,<br />오늘부터 함께 시작해요.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85">
            두 사람의 생활에 맞는 가계부를 만들고 수입과 지출을 함께 기록해 보세요.
          </p>
          <Link href="/login" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-7 py-3 text-sm font-extrabold text-[#9235d7] transition hover:-translate-y-0.5 hover:bg-[#fff7fc]">
            젤리안 무료로 시작하기 <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-[#8e42c8]">
          <Link href="/intro" className="hover:underline">서비스 소개</Link>
          <Link href="/blog" className="hover:underline">사용 가이드</Link>
          <Link href="/" className="hover:underline">젤리안 홈</Link>
        </div>
      </section>
    </main>
  );
}
