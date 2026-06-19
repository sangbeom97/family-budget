'use server';

import { supabase } from "@/lib/supabase";

export async function joinGroupByCode(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, needLogin: true, message: "로그인 필요" };

  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group) return { success: false, message: "잘못된 초대 코드입니다." };

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (error) {
    if (error.code === '23505') return { success: true, message: "이미 가입된 모임입니다." };
    return { success: false, message: "가입 실패: " + error.message };
  }

  return { success: true, message: "모임 가입 완료!" };
}
