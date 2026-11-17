-- 관리자 작업 이력 서버 측 페이지네이션
-- Supabase SQL Editor에서 실행하세요.

create or replace function public.get_jellian_admin_activity_logs_page(
  p_page integer default 1,
  p_page_size integer default 50,
  p_search text default null,
  p_action text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_page integer := greatest(1, coalesce(p_page, 1));
  safe_page_size integer := greatest(1, least(coalesce(p_page_size, 50), 100));
  keyword text := nullif(trim(coalesce(p_search, '')), '');
  action_filter text := nullif(trim(coalesce(p_action, '')), '');
  result jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_start_date is not null and p_end_date is not null and p_start_date > p_end_date then
    raise exception '시작일은 종료일보다 늦을 수 없습니다.';
  end if;

  with filtered as (
    select
      l.id,
      l.actor_id,
      u.email::text as actor_email,
      p.nickname::text as actor_nickname,
      l.action,
      l.target_type,
      l.target_id,
      l.summary,
      l.details,
      l.created_at
    from public.admin_activity_logs l
    left join auth.users u on u.id = l.actor_id
    left join public.profiles p on p.id = l.actor_id
    where
      (action_filter is null or l.action = action_filter)
      and (
        keyword is null
        or l.summary ilike '%' || keyword || '%'
        or coalesce(u.email, '') ilike '%' || keyword || '%'
        or coalesce(p.nickname, '') ilike '%' || keyword || '%'
        or coalesce(l.target_id, '') ilike '%' || keyword || '%'
        or l.details::text ilike '%' || keyword || '%'
      )
      and (
        p_start_date is null
        or l.created_at >= (p_start_date::timestamp at time zone 'Asia/Seoul')
      )
      and (
        p_end_date is null
        or l.created_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Seoul')
      )
  ),
  page_rows as (
    select *
    from filtered
    order by created_at desc, id desc
    limit safe_page_size
    offset (safe_page - 1) * safe_page_size
  )
  select jsonb_build_object(
    'total_count', (select count(*) from public.admin_activity_logs),
    'today_count', (
      select count(*)
      from public.admin_activity_logs
      where created_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
        and created_at < ((date_trunc('day', now() at time zone 'Asia/Seoul') + interval '1 day') at time zone 'Asia/Seoul')
    ),
    'filtered_count', (select count(*) from filtered),
    'logs', coalesce(
      (select jsonb_agg(to_jsonb(page_rows) order by page_rows.created_at desc, page_rows.id desc) from page_rows),
      '[]'::jsonb
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.get_jellian_admin_activity_logs_page(integer, integer, text, text, date, date) from public, anon;
grant execute on function public.get_jellian_admin_activity_logs_page(integer, integer, text, text, date, date) to authenticated;
