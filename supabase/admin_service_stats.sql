-- Jellian 관리자 서비스 통계 및 모임장 기준 이용료 예상
-- 정책: 모임장 소유의 운영 중인 모임 1개는 무료, 2개 이상이면 월 2,900원 고정.
-- 실제 결제 연동 전이므로 이용료는 예상 금액으로만 집계합니다.

drop function if exists public.get_jellian_admin_stats();

create function public.get_jellian_admin_stats()
returns table (
  total_members bigint,
  total_groups bigint,
  active_groups bigint,
  archived_groups bigint,
  total_transactions bigint,
  current_month_transactions bigint,
  total_group_owners bigint,
  free_group_owners bigint,
  premium_group_owners bigint,
  premium_owned_groups bigint,
  estimated_monthly_revenue bigint
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
  with owner_group_counts as (
    select g.created_by, count(*)::bigint as group_count
    from public.groups g
    where g.archived_at is null
      and g.created_by is not null
    group by g.created_by
  ),
  transaction_stats as (
    select
      count(t.id)::bigint as total_count,
      count(t.id) filter (
        where t.date >= date_trunc('month', current_date)::date
          and t.date < (date_trunc('month', current_date) + interval '1 month')::date
      )::bigint as month_count
    from public.transactions t
  )
  select
    (select count(*)::bigint from auth.users),
    (select count(*)::bigint from public.groups),
    (select count(*)::bigint from public.groups where archived_at is null),
    (select count(*)::bigint from public.groups where archived_at is not null),
    ts.total_count,
    ts.month_count,
    (select count(*)::bigint from owner_group_counts),
    (select count(*)::bigint from owner_group_counts where group_count = 1),
    (select count(*)::bigint from owner_group_counts where group_count >= 2),
    (select coalesce(sum(group_count), 0)::bigint from owner_group_counts where group_count >= 2),
    ((select count(*) from owner_group_counts where group_count >= 2) * 2900)::bigint
  from transaction_stats ts;
end;
$$;

revoke all on function public.get_jellian_admin_stats() from public, anon;
grant execute on function public.get_jellian_admin_stats() to authenticated;
