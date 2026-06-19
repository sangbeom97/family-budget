function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState("초대 코드를 확인하고 모임에 참여하는 중입니다...");

  useEffect(() => {
    // 🎯 1. code가 null인 경우를 여기서 먼저 완벽히 걸러냅니다.
    if (!code) {
      setStatus("❌ 올바르지 않은 초대 링크입니다.");
      return;
    }

    async function processJoin() {
      // 🎯 2. 위에서 null 체크를 통과했기 때문에 이제 TypeScript도 code를 완벽한 'string'으로 인식합니다.
      const result = await joinGroupByCode(code);

      if (result.success) {
        alert(result.message);
        router.push("/"); 
      } else {
        if (result.needLogin) {
          alert("가계부 방에 참여하려면 먼저 구글 로그인이 필요합니다! 로그인 화면으로 이동합니다.");
          router.push("/"); 
        } else {
          setStatus(`❌ 오류: ${result.message}`);
        }
      }
    }

    processJoin();
  }, [code, router]);

  return (
    <div className="text-center p-6 bg-white dark:bg-slate-950 rounded-2xl shadow-md border max-w-sm w-full">
      <h2 className="text-2xl font-black mb-2">📊 무계획 속 계획</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium animate-pulse">{status}</p>
    </div>
  );
}
