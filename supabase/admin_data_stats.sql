-- Jellian 관리자 데이터 현황 조회
-- Supabase SQL Editor에서 실행하세요. 원본 데이터는 변경하지 않습니다.

create or replace function public.get_jellian_admin_data_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return jsonb_build_object(
    'checked_at', now(),
    'members', (select count(*) from public.profiles),
    'groups', (select count(*) from public.groups),
    'group_members', (select count(*) from public.group_members),
    'categories', (select count(*) from public.categories),
    'budgets', (select count(*) from public.budgets),
    'transactions', (select count(*) from public.transactions),
    'support_requests', (select count(*) from public.support_requests)
  );
end;
$$;

revoke all on function public.get_jellian_admin_data_stats() from public;
grant execute on function public.get_jellian_admin_data_stats() to authenticated;
