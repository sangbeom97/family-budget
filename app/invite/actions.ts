'use server';

import { supabase } from "@/lib/supabase";

export async function joinGroupByCode(inviteCode: string) {
  // 1. 로그인 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, needLogin: true, message: "로그인 필요" };

  // 2. 그룹 조회
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group) return { success: false, message: "잘못된 코드" };

  // 3. 가입 처리
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (error) {
    if (error.code === '23505') return { success: true, message: "이미 가입됨" };
    return { success: false, message: "가입 실패" };
  }

  return { success: true, message: "가입 성공!" };
}
