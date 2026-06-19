'use server';

import { createClient } from "@/lib/supabase"; // 🎯 파일 위치에 맞게 수정 완료!

export async function joinGroupByCode(inviteCode: string) {
  const supabase = await createClient();

  // 1. 초대장을 열고 있는 로그인한 유저 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요한 서비스입니다." };
  }

  // 2. 입력된 초대코드가 실제로 groups 테이블에 존재하는지 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (groupError || !group) {
    return { success: false, message: "존재하지 않거나 만료된 초대코드입니다." };
  }

  // 3. group_members 테이블에 새 멤버로 추가 (참여 처리)
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id
    });

  if (joinError) {
    // 이미 참여한 방일 경우 (중복 참여 방지)
    if (joinError.code === '23505') {
      return { success: true, message: "이미 참여 중인 모임 방입니다!" };
    }
    return { success: false, message: "모임 참여 중 오류가 발생했습니다." };
  }

  return { success: true, message: "모임에 성공적으로 합류했습니다! 🎉" };
}
