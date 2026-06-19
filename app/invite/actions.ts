'use server';

import { supabase } from "@/lib/supabase"; // 기존 설정 파일 사용

export async function joinGroupByCode(inviteCode: string) {
  // 1. 현재 로그인된 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, needLogin: true, message: "로그인이 필요한 서비스입니다." };
  }

  // 2. 초대 코드 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (groupError || !group) {
    return { success: false, message: "존재하지 않거나 만료된 초대코드입니다." };
  }

  // 3. 그룹 가입
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (joinError) {
    if (joinError.code === '23505') return { success: true, message: "이미 참여 중인 방입니다! 🎉" };
    return { success: false, message: "가입 중 오류가 발생했습니다." };
  }

  return { success: true, message: "모임에 합류했습니다! 🎉" };
}
