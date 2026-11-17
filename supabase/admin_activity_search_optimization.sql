-- Jellian 관리자 작업 이력 검색 성능 개선
-- 기존 작업 이력 데이터는 변경하거나 삭제하지 않습니다.

create extension if not exists pg_trgm with schema extensions;

-- 부분 문자열 검색을 위한 trigram 인덱스
create index if not exists admin_activity_logs_summary_trgm_idx
  on public.admin_activity_logs using gin (summary extensions.gin_trgm_ops);

create index if not exists admin_activity_logs_target_id_trgm_idx
  on public.admin_activity_logs using gin (target_id extensions.gin_trgm_ops);

create index if not exists profiles_nickname_trgm_idx
  on public.profiles using gin (nickname extensions.gin_trgm_ops);

create index if not exists auth_users_email_trgm_idx
  on auth.users using gin (email extensions.gin_trgm_ops);

-- details::text 전체 검색은 대용량 JSON 변환으로 느려질 수 있어 검색 대상에서 제외합니다.
-- 작업 요약, 관리자 이메일/닉네임, 대상 ID 검색은 유지합니다.
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
