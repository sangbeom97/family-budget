import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountStatus = "active" | "expelled" | "blacklisted";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return Response.json({ error: "로그인 인증이 필요합니다." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase 환경변수가 설정되지 않았습니다." }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return Response.json({ error: "로그인 인증이 만료되었거나 유효하지 않습니다." }, { status: 401 });
    }

    const { data: isAdmin, error: adminCheckError } = await authClient.rpc("is_jellian_admin");
    if (adminCheckError || isAdmin !== true) {
      return Response.json({ error: "관리자 계정만 이용할 수 있습니다." }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as {
      userId?: string;
      status?: AccountStatus;
      reason?: string;
    } | null;

    const targetUserId = body?.userId?.trim();
    const status = body?.status;
    const reason = body?.reason?.trim() || null;

    if (!targetUserId || !/^[0-9a-f-]{36}$/i.test(targetUserId)) {
      return Response.json({ error: "올바른 회원을 선택해 주세요." }, { status: 400 });
    }
    if (!status || !["active", "expelled", "blacklisted"].includes(status)) {
      return Response.json({ error: "올바른 회원 상태가 아닙니다." }, { status: 400 });
    }
    if (reason && reason.length > 1000) {
      return Response.json({ error: "사유는 1,000자 이내로 입력해 주세요." }, { status: 400 });
    }
    if (targetUserId === userData.user.id) {
      return Response.json({ error: "현재 로그인한 관리자 계정은 여기서 변경할 수 없습니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data: targetAdmin, error: targetAdminError } = await admin
      .from("jellian_admins")
      .select("user_id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (targetAdminError) {
      return Response.json({ error: "대상 회원의 관리자 권한을 확인하지 못했습니다." }, { status: 500 });
    }
    if (targetAdmin) {
      return Response.json({ error: "다른 관리자 계정은 이 화면에서 제명하거나 차단할 수 없습니다." }, { status: 400 });
    }

    const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(targetUserId);
    if (targetUserError || !targetUser.user) {
      return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    const { error: statusError } = await admin
      .from("account_access_status")
      .upsert({
        user_id: targetUserId,
        status,
        reason: status === "active" ? null : reason,
        changed_by: userData.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (statusError) {
      console.error("회원 상태 저장 실패:", statusError);
      return Response.json({ error: "회원 상태를 저장하지 못했습니다." }, { status: 500 });
    }

    const { error: banError } = await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: status === "active" ? "none" : "876000h",
    });

    if (banError) {
      console.error("회원 로그인 차단 갱신 실패:", banError);
      return Response.json({
        error: "DB 접근 상태는 반영했지만 로그인 차단 갱신에 실패했습니다. 다시 시도해 주세요.",
      }, { status: 502 });
    }

    const action = status === "expelled"
      ? "member_expel"
      : status === "blacklisted"
        ? "member_blacklist"
        : "member_access_restore";
    const summary = status === "expelled"
      ? "회원 제명"
      : status === "blacklisted"
        ? "회원 블랙리스트 등록"
        : "회원 이용 상태 복구";

    const { error: logError } = await admin.from("admin_activity_logs").insert({
      actor_id: userData.user.id,
      action,
      target_type: "member",
      target_id: targetUserId,
      summary,
      details: { status, reason },
    });

    if (logError) {
      console.error("회원 관리 로그 기록 실패:", logError);
    }

    return Response.json({ success: true, status });
  } catch (error) {
    console.error("회원 상태 변경 실패:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "회원 상태 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
