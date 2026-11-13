
const sections = [
  {
    id: "start",
    number: "01",
    title: "가계부 시작하기",
    description: "공유 가계부를 만들고 가족이나 멤버와 함께 사용하세요.",
    steps: [
      "구글 계정으로 로그인합니다.",
      "상단의 새 가계부 만들기에 이름을 입력하고 개설을 누릅니다.",
      "이미 만들어진 가계부가 있다면 초대 링크를 통해 참여할 수 있습니다.",
      "현재 가계부 선택에서 관리할 가계부를 선택합니다.",
    ],
  },
  {
    id: "transaction",
    number: "02",
    title: "수입·지출 내역 관리",
    description: "거래 내역을 직접 입력하고 수정하거나 삭제할 수 있습니다.",
    steps: [
      "가계부 탭에서 지출 또는 수입을 선택합니다.",
      "항목명, 금액, 날짜, 카테고리를 입력합니다.",
      "지출은 고정지출, 변동지출, 용돈, 저축으로 구분할 수 있습니다.",
      "메모는 필요한 경우 추가합니다.",
      "내역 추가하기를 누르면 거래가 등록됩니다.",
      "등록된 내역의 수정 또는 삭제 버튼으로 관리할 수 있습니다.",
    ],
  },
  {
    id: "view",
    number: "03",
    title: "조회 및 통계 활용",
    description: "다양한 기준으로 거래 내역과 소비 흐름을 확인하세요.",
    steps: [
      "전체, 수입, 고정지출, 변동지출, 용돈, 저축 탭으로 구분해 조회합니다.",
      "리스트에서는 거래 내역과 카테고리별 지출 현황을 확인합니다.",
      "달력에서는 날짜별 거래 내역을 확인합니다.",
      "연요약에서는 월별 지출, 저축률, 소비 패턴과 카테고리 TOP5를 확인합니다.",
      "검색어와 카테고리 필터를 함께 사용할 수 있습니다.",
      "시작일과 종료일을 지정하면 원하는 기간만 조회할 수 있습니다.",
    ],
  },
  {
    id: "budget",
    number: "04",
    title: "예산 관리",
    description: "카테고리별 예산을 설정하고 소비 현황을 확인하세요.",
    steps: [
      "가계부 탭에서 예산 보기를 선택합니다.",
      "각 카테고리의 예산 입력란에 목표 금액을 입력합니다.",
      "사용 금액과 예산 대비 사용률을 확인합니다.",
      "대시보드의 예산 대비 사용 현황 그래프로 남은 예산을 확인할 수 있습니다.",
    ],
  },
  {
    id: "category",
    number: "05",
    title: "카테고리 관리",
    description: "우리 집 소비 방식에 맞게 카테고리를 구성하세요.",
    steps: [
      "상단의 카테고리 관리 탭으로 이동합니다.",
      "카테고리명과 유형을 선택합니다.",
      "추가하기를 눌러 새로운 카테고리를 등록합니다.",
      "등록된 카테고리의 X 버튼으로 삭제할 수 있습니다.",
      "카테고리는 고정지출, 변동지출, 용돈, 저축, 수입으로 구분됩니다.",
    ],
  },
  {
    id: "members",
    number: "06",
    title: "그룹 멤버 관리",
    description: "멤버별 권한을 구분해 공동 가계부를 관리하세요.",
    steps: [
      "멤버 초대에서 카카오톡 초대 링크를 복사해 공유합니다.",
      "그룹 멤버 탭에서 현재 가계부에 참여한 멤버를 확인합니다.",
      "모임장은 멤버의 역할을 모임장, 운영진, 모임원으로 변경할 수 있습니다.",
      "모임장과 운영진은 거래 내역을 등록·수정·삭제할 수 있습니다.",
      "모임원은 거래 내역을 조회할 수 있지만 직접 수정하거나 삭제할 수 없습니다.",
    ],
  },
  {
    id: "excel",
    number: "07",
    title: "Excel 가져오기 및 내보내기",
    description: "Excel 파일을 이용해 거래 내역을 한 번에 등록하거나 보관하세요.",
    steps: [
      "가계부 화면 하단의 Excel 가져오기 / 내보내기 영역을 이용합니다.",
      "파일 선택을 눌러 .xlsx 또는 .xls 파일을 업로드합니다.",
      "업로드 시 첫 번째 시트의 거래 데이터가 등록됩니다.",
      "내보내기를 누르면 선택한 월의 거래 내역을 Excel 파일로 저장합니다.",
    ],
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-8 text-[#191f28] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <span className="mb-3 inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-xs font-bold text-[#3182f6]">
            JELLIAN GUIDE
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Jellian 사용 가이드
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b7684] sm:text-base">
            우리 가족의 수입과 지출을 한곳에서 관리하고,
            함께 사용하는 가계부를 더 편리하게 이용하는 방법을 안내합니다.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["🏠", "공유 가계부"],
              ["💳", "수입·지출 관리"],
              ["📊", "통계 및 예산"],
              ["📁", "Excel 연동"],
            ].map(([icon, label]) => (
              <div key={label} className="rounded-2xl bg-[#f7f8fa] p-4">
                <div className="text-2xl">{icon}</div>
                <p className="mt-2 text-sm font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e9edf2] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-extrabold">가이드 목차</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-xl bg-[#f7f8fa] px-4 py-3 text-sm font-semibold transition hover:bg-[#eef5ff]"
              >
                <span className="font-extrabold text-[#3182f6]">
                  {section.number}
                </span>
                {section.title}
                <span className="ml-auto text-[#aab2bd]">↗</span>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-2xl border border-[#e9edf2] bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-sm font-extrabold text-[#3182f6]">
                  {section.number}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold sm:text-xl">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#8b95a1]">
                    {section.description}
                  </p>
                </div>
              </div>

              <ol className="mt-5 space-y-3 border-t border-[#f0f2f4] pt-5">
                {section.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-6">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-xs font-bold text-[#4e5968]">
                      {index + 1}
                    </span>
                    <span className="text-[#4e5968]">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-[#f5d778] bg-[#fffaf0] p-5">
          <h2 className="font-extrabold text-[#805b10]">
            📌 이용 시 참고사항
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#806b43]">
            <li>• Excel 업로드는 첫 번째 시트의 데이터를 등록합니다.</li>
            <li>• 같은 Excel 파일을 반복 업로드하면 동일한 거래가 중복 등록될 수 있으니 주의하세요.</li>
            <li>• 업로드 파일은 날짜, 내역명, 금액, 타입, 카테고리, 지출분류, 메모 항목을 기준으로 작성하는 것을 권장합니다.</li>
            <li>• 지출분류 값은 fixed, variable, allowance, saving을 사용합니다.</li>
            <li>• 예산 기능은 모임장과 운영진에게 제공됩니다.</li>
          </ul>
        </div>

        <div className="mt-8 pb-6 text-center">
          <p className="text-sm font-semibold text-[#4e5968]">
            Jellian과 함께 더 투명하고 편리한 가계부를 만들어 보세요.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#3182f6] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1b64da]"
          >
            가계부로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}
