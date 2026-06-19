'use server';

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function joinGroupByCode(inviteCode: string) {
  // 🎯 Next.js 서버 액션 전용 Supabase 클라이언트 생성 (쿠키 연동으로 세션 추적)
  const supabase = createServerActionClient({ cookies });
  
  // 1. 현재 브라우저에 로그인된 유저가 있는지 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  // 로그인이 안 되어 있다면 로그인 유도 신호를 클라이언트에 반환
  if (!user) {
    return { success: false, needLogin: true, message: "로그인이 필요한 서비스입니다." };
  }

  // 2. 입력된 초대코드가 실제로 존재하는 그룹인지 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (groupError || !group) {
    return { success: false, message: "존재하지 않거나 만료된 초대코드입니다." };
  }

  // 3. 해당 그룹에 새 멤버로 추가 (중복 방지 처리 포함)
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id
    });

  if (joinError) {
    // 이미 가입된 방일 경우 유연하게 성공 처리
    if (joinError.code === '23505') {
      return { success: true, message: "이미 참여 중인 모임 방입니다! 🎉" };
    }
    return { success: false, message: "모임 참여 중 오류가 발생했습니다." };
  }

  return { success: true, message: "모임에 성공적으로 합류했습니다! 🎉" };
}
