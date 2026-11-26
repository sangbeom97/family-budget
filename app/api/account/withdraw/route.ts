import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const body = await request.json().catch(() => null) as { confirmation?: string } | null;
    if (body?.confirmation !== "탈퇴") {
      return Response.json({ error: "회원 탈퇴 확인 문구가 올바르지 않습니다." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const userId = userData.user.id;

    const { data: adminRecord, error: adminRecordError } = await admin
      .from("jellian_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminRecordError) {
      return Response.json({ error: "관리자 권한을 확인하지 못했습니다." }, { status: 500 });
    }

    if (adminRecord) {
      const { count, error: adminCountError } = await admin
        .from("jellian_admins")
        .select("user_id", { count: "exact", head: true });
      if (adminCountError || (count ?? 0) <= 1) {
        return Response.json({
          error: "마지막 관리자는 바로 탈퇴할 수 없습니다. 먼저 다른 관리자를 지정해 주세요.",
        }, { status: 400 });
      }
    }

    // Block all existing sessions before beginning the cleanup.
    const { error: statusError } = await admin
      .from("account_access_status")
      .upsert({
        user_id: userId,
        status: "blacklisted",
        reason: "회원 본인 탈퇴 처리 중",
        changed_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (statusError) {
      console.error("탈퇴 상태 기록 실패:", statusError);
      return Response.json({ error: "탈퇴 처리를 시작하지 못했습니다." }, { status: 500 });
    }

    // Capture storage paths before the support request rows are deleted.
    const { data: attachments, error: attachmentsError } = await admin
      .from("support_request_attachments")
      .select("storage_path")
      .eq("user_id", userId);

    if (attachmentsError) {
      console.error("탈퇴 첨부파일 조회 실패:", attachmentsError);
      return Response.json({ error: "문의 첨부파일 정리 준비에 실패했습니다. 계정은 차단된 상태입니다." }, { status: 500 });
    }

    const storagePaths = (attachments || [])
      .map((item) => item.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    for (let i = 0; i < storagePaths.length; i += 100) {
      const { error: storageError } = await admin.storage
        .from("support-attachments")
        .remove(storagePaths.slice(i, i + 100));
      if (storageError) {
        console.error("탈퇴 첨부파일 삭제 실패:", storageError);
        return Response.json({ error: "문의 첨부파일 삭제에 실패했습니다. 계정은 차단된 상태입니다." }, { status: 502 });
      }
    }

    const { error: cleanupError } = await admin.rpc("withdraw_account_data", {
      p_user_id: userId,
    });

    if (cleanupError) {
      console.error("탈퇴 데이터 정리 실패:", cleanupError);
      return Response.json({ error: "계정 데이터 정리에 실패했습니다. 계정은 차단된 상태입니다." }, { status: 502 });
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Auth 계정 삭제 실패:", deleteUserError);
      return Response.json({ error: "개인 데이터는 정리했지만 로그인 계정 삭제에 실패했습니다. 관리자에게 문의해 주세요." }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("회원 탈퇴 처리 실패:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다." },
      { status: 500 },
    );
  }
}
