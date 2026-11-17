-- Jellian 관리자 문의 관리 서버 측 페이지네이션 및 미처리 알림
-- 기존 문의 데이터와 처리 이력은 변경하지 않습니다.

create or replace function public.get_jellian_admin_support_requests_page(
  p_page integer default 1,
  p_page_size integer default 20,
  p_search text default '',
  p_category text default 'all',
  p_status text default 'all'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 20), 1), 100);
  v_search text := lower(trim(coalesce(p_search, '')));
  v_category text := coalesce(nullif(trim(p_category), ''), 'all');
  v_status text := coalesce(nullif(trim(p_status), ''), 'all');
  v_total_count bigint;
  v_received_count bigint;
  v_in_progress_count bigint;
  v_completed_count bigint;
  v_filtered_count bigint;
  v_requests jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select
    count(*),
    count(*) filter (where s.status = 'received'),
    count(*) filter (where s.status = 'in_progress'),
    count(*) filter (where s.status = 'completed')
  into v_total_count, v_received_count, v_in_progress_count, v_completed_count
  from public.support_requests s;

  select count(*)
  into v_filtered_count
  from public.support_requests s
  left join auth.users u on u.id = s.user_id
  left join public.profiles p on p.id = s.user_id
  where (v_category = 'all' or s.category = v_category)
    and (v_status = 'all' or s.status = v_status)
    and (
      v_search = ''
      or lower(coalesce(s.subject, '')) like '%' || v_search || '%'
      or lower(coalesce(s.content, '')) like '%' || v_search || '%'
      or lower(coalesce(p.nickname, '')) like '%' || v_search || '%'
      or lower(coalesce(u.email, '')) like '%' || v_search || '%'
      or lower(coalesce(s.contact_email, '')) like '%' || v_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(page_rows) order by
    case page_rows.status when 'received' then 0 when 'in_progress' then 1 else 2 end,
    page_rows.created_at desc
  ), '[]'::jsonb)
  into v_requests
  from (
    select
      s.id,
      s.user_id,
      u.email::text as user_email,
      p.nickname::text as nickname,
      s.contact_email,
      s.category,
      s.subject,
      s.content,
      s.status,
      s.admin_response,
      s.handled_by,
      s.handled_at,
      s.created_at,
      s.updated_at
    from public.support_requests s
    left join auth.users u on u.id = s.user_id
    left join public.profiles p on p.id = s.user_id
    where (v_category = 'all' or s.category = v_category)
      and (v_status = 'all' or s.status = v_status)
      and (
        v_search = ''
        or lower(coalesce(s.subject, '')) like '%' || v_search || '%'
        or lower(coalesce(s.content, '')) like '%' || v_search || '%'
        or lower(coalesce(p.nickname, '')) like '%' || v_search || '%'
        or lower(coalesce(u.email, '')) like '%' || v_search || '%'
        or lower(coalesce(s.contact_email, '')) like '%' || v_search || '%'
      )
    order by
      case s.status when 'received' then 0 when 'in_progress' then 1 else 2 end,
      s.created_at desc
    limit v_page_size
    offset (v_page - 1) * v_page_size
  ) page_rows;

  perform public.write_jellian_admin_activity(
    'support_list_view',
    'support_requests',
    null,
    '문의 목록 조회',
    jsonb_build_object(
      'page', v_page,
      'page_size', v_page_size,
      'search', v_search,
      'category', v_category,
      'status', v_status
    )
  );

  return jsonb_build_object(
    'total_count', v_total_count,
    'received_count', v_received_count,
    'in_progress_count', v_in_progress_count,
    'completed_count', v_completed_count,
    'unprocessed_count', v_received_count + v_in_progress_count,
    'filtered_count', v_filtered_count,
    'page', v_page,
    'page_size', v_page_size,
    'requests', v_requests
  );
end;
$$;

revoke all on function public.get_jellian_admin_support_requests_page(integer, integer, text, text, text) from public, anon;
grant execute on function public.get_jellian_admin_support_requests_page(integer, integer, text, text, text) to authenticated;
