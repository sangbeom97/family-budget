-- Jellian 관리자 월별 예상 이용료 추이
-- 관리자 통계 페이지를 조회한 날의 최초 값만 일별로 저장합니다.
-- 매월 그래프에는 해당 월의 가장 최근 저장값을 표시합니다.
-- 실제 결제 매출이 아닌 예상 이용료입니다.

create table if not exists public.jellian_admin_revenue_snapshots (
  snapshot_date date primary key,
  premium_group_owners integer not null default 0,
  estimated_monthly_revenue integer not null default 0,
  created_at timestamptz not null default now()
);

revoke all on table public.jellian_admin_revenue_snapshots from public, anon, authenticated;

create or replace function public.get_jellian_admin_revenue_trend()
returns table (
  month_label text,
  snapshot_date date,
  premium_group_owners integer,
  estimated_monthly_revenue integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_date date := (now() at time zone 'Asia/Seoul')::date;
  v_premium_owners integer;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select count(*)::integer
  into v_premium_owners
  from (
    select g.created_by
    from public.groups g
    where g.archived_at is null
      and g.created_by is not null
    group by g.created_by
    having count(*) >= 2
  ) owners;

  insert into public.jellian_admin_revenue_snapshots (
    snapshot_date,
    premium_group_owners,
    estimated_monthly_revenue
  )
  values (
    v_snapshot_date,
    v_premium_owners,
    v_premium_owners * 2900
  )
  on conflict (snapshot_date) do nothing;

  return query
  with monthly_latest as (
    select distinct on (date_trunc('month', s.snapshot_date::timestamp))
      date_trunc('month', s.snapshot_date::timestamp) as month_start,
      s.snapshot_date,
      s.premium_group_owners,
      s.estimated_monthly_revenue
    from public.jellian_admin_revenue_snapshots s
    where s.snapshot_date >=
      (date_trunc('month', (now() at time zone 'Asia/Seoul')) - interval '11 months')::date
    order by date_trunc('month', s.snapshot_date::timestamp), s.snapshot_date desc
  )
  select
    to_char(m.month_start, 'YYYY.MM'),
    m.snapshot_date,
    m.premium_group_owners,
    m.estimated_monthly_revenue
  from monthly_latest m
  order by m.month_start;
end;
$$;

revoke all on function public.get_jellian_admin_revenue_trend() from public, anon;
grant execute on function public.get_jellian_admin_revenue_trend() to authenticated;
