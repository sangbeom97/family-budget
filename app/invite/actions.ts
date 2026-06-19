'use server';

import { supabase } from "@/lib/supabase";

export async function joinGroupByCode(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인 필요" };

  // 1. 초대 코드로 그룹 찾기
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group || groupError) return { success: false, message: "잘못된 초대 코드" };

  // 2. 가입 시도
  const { error: insertError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (insertError) {
    console.error("가입 에러 상세:", insertError);
    if (insertError.code === '23505') return { success: true, message: "이미 가입됨" };
    return { success: false, message: "DB 에러: " + insertError.message };
  }

  return { success: true, message: "가입 성공" };
}
