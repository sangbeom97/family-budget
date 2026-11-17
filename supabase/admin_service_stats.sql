-- Jellian 관리자 서비스 통계
-- Supabase SQL Editor에서 실행하세요. 조회 전용이며 원본 데이터를 변경하지 않습니다.

create or replace function public.get_jellian_admin_stats()
returns table (
  total_members bigint,
  total_groups bigint,
  active_groups bigint,
  archived_groups bigint,
  total_transactions bigint,
  total_income numeric,
  total_expense numeric,
  current_month_transactions bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return query
  select
    (select count(*)::bigint from auth.users),
    (select count(*)::bigint from public.groups),
    (select count(*)::bigint from public.groups where archived_at is null),
    (select count(*)::bigint from public.groups where archived_at is not null),
    count(t.id)::bigint,
    coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0)::numeric,
    coalesce(sum(case when t.type is distinct from 'income' then t.amount else 0 end), 0)::numeric,
    count(t.id) filter (
      where t.date >= date_trunc('month', current_date)::date
        and t.date < (date_trunc('month', current_date) + interval '1 month')::date
    )::bigint
  from public.transactions t;
end;
$$;

revoke all on function public.get_jellian_admin_stats() from public;
grant execute on function public.get_jellian_admin_stats() to authenticated;
