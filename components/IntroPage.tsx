"use client";

import Link from "next/link";
import Image from "next/image";

const features = [
  {
    number: "01",
    emoji: "👫",
    title: "여러 사람이 함께 기록해요",
    description:
      "가계부를 만들고 멤버를 초대해 보세요. 각자 기록한 거래를 하나의 공간에서 함께 확인할 수 있어요.",
    tone: "from-violet-100 to-pink-100",
  },
  {
    number: "02",
    emoji: "🧾",
    title: "수입과 지출을 정리해요",
    description:
      "수입, 고정지출, 변동지출, 용돈, 저축을 구분해 우리 집 돈의 흐름을 기록할 수 있어요.",
    tone: "from-pink-100 to-rose-100",
  },
  {
    number: "03",
    emoji: "🗓️",
    title: "달력으로 돌아봐요",
    description:
      "리스트와 달력에서 거래 내역을 확인하고, 검색과 기간 필터로 원하는 기록을 찾아보세요.",
    tone: "from-fuchsia-100 to-violet-100",
  },
  {
    number: "04",
    emoji: "🎯",
    title: "예산과 통계를 확인해요",
    description:
      "카테고리별 예산과 사용 금액을 비교하고, 월별·연간 소비 흐름을 살펴볼 수 있어요.",
    tone: "from-violet-100 to-indigo-100",
  },
  {
    number: "05",
    emoji: "📂",
    title: "엑셀도 편리하게",
    description:
      "엑셀 거래 내역을 가져오고 내보낼 수 있어요. 업로드할 때 중복이 의심되는 거래도 확인할 수 있습니다.",
    tone: "from-rose-100 to-pink-100",
  },
  {
    number: "06",
    emoji: "🏡",
    title: "목적에 맞게 관리해요",
    description:
      "부부 생활비부터 동아리 공금까지, 사용 목적에 맞는 가계부를 만들고 카테고리를 구성해 보세요.",
    tone: "from-indigo-100 to-violet-100",
  },
];

const steps = [
  ["가계부 만들기", "부부·가족, 모임·동아리, 여행·프로젝트 등 사용 목적에 맞는 가계부를 만드세요."],
  ["멤버 초대하기", "초대 링크를 공유해 함께 관리할 멤버를 초대하세요."],
  ["함께 관리하기", "수입과 지출을 기록하고 예산과 내역을 함께 확인하세요."],
];

export default function IntroPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaff] text-[#292238]">
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(210,160,255,0.24),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(255,170,198,0.25),transparent_30%),linear-gradient(180deg,#fffaff_0%,#fff_100%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0dafa] bg-white/80 px-4 py-2 text-xs font-bold text-[#9145c9] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#9229e8] to-[#ff5b9c]" />
              커플부터 동아리까지, 함께 쓰는 공유 가계부
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[1.18] tracking-tight sm:text-5xl lg:text-[3.65rem]">
              함께 쓰는 돈 관리,
              <span className="mt-2 block bg-gradient-to-r from-[#8528e8] to-[#f34d9a] bg-clip-text text-transparent">
                함께 관리해요.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#71677d] sm:text-lg">
              생활비와 공동경비부터 회비, 행사비까지.
              여러 사람이 함께 쓰는 돈을 하나의 가계부에서 기록하고 투명하게 관리해 보세요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#c77be8]/25 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Jellian 시작하기 <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/blog"
                className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-[#eadcf3] bg-white px-7 py-4 text-sm font-bold text-[#665675] transition hover:bg-[#fcf5ff]"
              >
                사용 방법 보기
              </Link>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#a096ad]">
              현재 웹에서 이용할 수 있으며, 모바일 앱은 준비 중입니다.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-5 top-8 h-24 w-24 rounded-full bg-[#e8d1ff] blur-2xl" />
            <div className="absolute -right-3 bottom-4 h-28 w-28 rounded-full bg-[#ffd4e5] blur-2xl" />
            <div className="relative rounded-[2rem] border border-white bg-white/90 p-4 shadow-[0_24px_80px_rgba(114,65,145,0.14)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#f1eaf5] pb-4">
                <div className="flex items-center gap-2">
                  <Image src="/images/logo.png" alt="Jellian 로고" width={130} height={48} className="h-9 w-auto object-contain" priority />
                  <span className="rounded-full bg-[#f8edff] px-2 py-1 text-[10px] font-bold text-[#984bd0]">함께 쓰는 가계부</span>
                </div>
                <span className="text-xs text-[#9b91a5]">이번 달</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[#f4eaff] p-3">
                  <p className="text-[11px] font-bold text-[#8e51bd]">수입</p>
                  <p className="mt-2 text-sm font-black text-[#65339a]">함께 기록</p>
                </div>
                <div className="rounded-2xl bg-[#fff0f4] p-3">
                  <p className="text-[11px] font-bold text-[#d45c8b]">지출</p>
                  <p className="mt-2 text-sm font-black text-[#a83f70]">함께 확인</p>
                </div>
                <div className="rounded-2xl bg-[#f0edff] p-3">
                  <p className="text-[11px] font-bold text-[#7861c5]">저축</p>
                  <p className="mt-2 text-sm font-black text-[#5945a3]">목표 관리</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[#f0eaf4] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold">이번 달 소비 기록</p>
                  <span className="text-xs text-[#a096ad]">카테고리별</span>
                </div>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#f4eff7]">
                  <span className="w-[38%] bg-[#9b63e8]" />
                  <span className="w-[27%] bg-[#ef78ad]" />
                  <span className="w-[18%] bg-[#f4bd72]" />
                  <span className="w-[17%] bg-[#c6b4e8]" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#776d82]">
                  <span>● 식비</span><span>● 생활용품</span>
                  <span>● 교통비</span><span>● 기타</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#fff7fb] p-4">
                <div>
                  <p className="text-sm font-extrabold">우리 모두 함께</p>
                  <p className="mt-1 text-xs text-[#93869e]">함께 기록하고, 확인하고, 계획해요.</p>
                </div>
                <div className="flex -space-x-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e7d5ff]">🙂</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#ffd9e8]">😊</span>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-[#b0a6b8]">서비스 소개용 예시 UI · 실제 데이터가 아닙니다</p>
            </div>
            <span className="absolute -right-4 -top-5 rotate-12 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#a14bd3] shadow-lg">함께 관리 💜</span>
            <span className="absolute -bottom-5 -left-4 -rotate-6 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#e15c91] shadow-lg">모임답게 관리해요 :)</span>
          </div>
        </div>
      </section>


      <section className="bg-white px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">MADE FOR YOUR GROUP</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">어떤 모임이든, 함께 관리하세요</h2>
            <p className="mt-4 text-sm leading-7 text-[#81768c] sm:text-base">
              Jellian은 한 가지 형태에 한정되지 않아요. 돈을 함께 관리하는 곳이라면 어디서든 활용할 수 있어요.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["🏡", "부부·가족", "생활비, 공과금, 공동 저축과 가족 지출"],
              ["🎓", "동아리·소모임", "정기 회비, 공금, 모임과 행사 운영비"],
              ["🧳", "친구·여행", "여행 경비, 공동 구매, 함께 쓴 비용"],
              ["🛠️", "팀·프로젝트", "프로젝트 운영비와 공동 지출 기록"],
            ].map(([emoji, title, description]) => (
              <article key={title} className="rounded-3xl border border-[#f0e8f5] bg-gradient-to-br from-[#fffaff] to-[#fff5fa] p-6">
                <span className="text-3xl">{emoji}</span>
                <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#81768c]">{description}</p>
                {title === "부부·가족" && (
                  <Link
                    href="/couple-budget"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-[#9145c9] hover:underline"
                  >
                    부부 가계부 자세히 보기 <span aria-hidden="true">→</span>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">WHAT YOU CAN DO</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">함께 쓰는 가계부에 필요한 기능</h2>
          <p className="mt-4 text-sm leading-7 text-[#81768c] sm:text-base">
            복잡하게 꾸미기보다, 매일 쓰는 데 필요한 기능을 한곳에 모았습니다.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-3xl border border-[#f0e8f5] bg-white p-6 shadow-[0_8px_30px_rgba(100,60,120,0.04)] transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.tone} text-2xl`}>
                {feature.emoji}
              </div>
              <p className="mt-5 text-xs font-black tracking-widest text-[#b18acb]">{feature.number}</p>
              <h3 className="mt-2 text-lg font-extrabold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#81768c]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>


      <section className="bg-[#fbf8ff] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">MEMBER PERMISSIONS</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">역할에 따라 권한을 나눠 관리해요</h2>
            <p className="mt-4 text-sm leading-7 text-[#81768c] sm:text-base">
              모임의 운영 방식에 맞게 모임장, 운영진, 모임원 권한을 구분할 수 있어요.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[#f0dfb5] bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-full bg-[#fff5d6] px-3 py-1.5 text-xs font-extrabold text-[#a16b16]">👑 모임장</div>
              <h3 className="mt-4 text-xl font-black">모임 전체 관리</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#665d70]">
                <li>✓ 거래 내역 등록·수정·삭제</li>
                <li>✓ 예산 설정 및 관리</li>
                <li>✓ 멤버 역할 변경 및 모임장 이전</li>
                <li>✓ 멤버 강제 퇴장</li>
                <li>✓ 모임 해체</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-[#dce8ff] bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-full bg-[#eaf2ff] px-3 py-1.5 text-xs font-extrabold text-[#3972c8]">🛠 운영진</div>
              <h3 className="mt-4 text-xl font-black">가계부 운영 참여</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#665d70]">
                <li>✓ 거래 내역 등록·수정·삭제</li>
                <li>✓ 예산 설정 및 관리</li>
                <li>✓ 거래 내역과 통계 확인</li>
                <li>✓ 모임 멤버 목록 확인</li>
                <li>— 멤버 권한 변경·강제 퇴장 불가</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-[#e9e4ef] bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-full bg-[#f2f4f6] px-3 py-1.5 text-xs font-extrabold text-[#667080]">👤 모임원</div>
              <h3 className="mt-4 text-xl font-black">내역 확인 중심</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#665d70]">
                <li>✓ 거래 내역 및 통계 조회</li>
                <li>✓ 기간·카테고리별 내역 확인</li>
                <li>✓ 달력 및 연간 요약 확인</li>
                <li>✓ 본인 그룹 탈퇴</li>
                <li>— 거래 등록·수정·삭제 및 예산 관리 불가</li>
              </ul>
            </article>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-6 text-[#91879b]">
            권한은 현재 서비스 화면에 적용된 기능 기준입니다. 카테고리 관리 및 엑셀 기능의 세부 권한은 별도 정책 확인이 필요합니다.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#f3e8ff] via-[#fff1f7] to-[#fff8fc] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#a14bd3]">HOW TO START</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">시작은 간단해요</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map(([title, description], index) => (
              <div key={title} className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#8d35e8] to-[#f05b9c] text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#81768c]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-r from-[#8528e8] to-[#f04e9a] px-6 py-12 text-center text-white shadow-xl shadow-[#d18be7]/20 sm:px-12">
          <div className="flex justify-center"><Image src="/images/logo.png" alt="Jellian 로고" width={150} height={56} className="h-10 w-auto rounded-lg bg-white px-3 py-1 object-contain" /></div>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">함께 쓰는 돈,<br />이제 한곳에서 관리해요.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85">
            부부·가족부터 동아리와 소모임까지. 가계부를 만들고 멤버를 초대해 함께 기록해 보세요.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-extrabold text-[#9235d7] transition hover:-translate-y-0.5 hover:bg-[#fff7fc]"
          >
            무료로 시작하기 <span aria-hidden="true">→</span>
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-white">
            <Link href="/couple-budget" className="underline decoration-white/50 underline-offset-4 hover:decoration-white">
              부부 가계부 안내
            </Link>
            <Link href="/blog" className="underline decoration-white/50 underline-offset-4 hover:decoration-white">
              사용 가이드 보기
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/70">현재 웹 버전 이용 가능 · 모바일 앱 준비 중</p>
        </div>
      </section>

      <footer className="border-t border-[#f0e8f5] bg-white px-5 py-8 text-center text-xs text-[#a096ad]">
        <div className="flex justify-center"><Image src="/images/logo.png" alt="Jellian 로고" width={110} height={42} className="h-8 w-auto object-contain" /></div>
        <p className="mt-2">함께 쓰는 돈, 함께 관리하는 가계부.</p>
        <Link href="/blog" className="mt-3 inline-block font-semibold text-[#8e42c8] hover:underline">
          사용 가이드 보기
        </Link>
        <Link href="/articles" className="mt-3 ml-4 inline-block font-semibold text-[#8e42c8] hover:underline">
          부부 생활비 관리 팁
        </Link>
      </footer>
    </main>
  );
}
