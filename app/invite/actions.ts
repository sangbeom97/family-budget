'use server';

import { supabase } from "@/lib/supabase";

export async function joinGroupByCode(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, needLogin: true, message: "로그인이 필요한 서비스입니다." };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (groupError || !group) {
    return { success: false, message: "유효하지 않은 초대코드입니다." };
  }

  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (joinError) {
    if (joinError.code === '23505') return { success: true, message: "이미 참여 중인 모임입니다." };
    return { success: false, message: "가입 실패" };
  }

  return { success: true, message: "모임 합류 성공!" };
}
