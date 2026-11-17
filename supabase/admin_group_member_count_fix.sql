-- 인원 0명 모임의 운영 상태 집계 보정
-- user_id가 비어 있는 group_members 행은 실제 회원으로 계산하지 않습니다.

create or replace function public.get_jellian_admin_groups_page(
  p_page integer default 1,
  p_page_size integer default 20,
  p_search text default '',
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
  v_status text := case when p_status in ('active', 'empty', 'archived') then p_status else 'all' end;
  v_total_count bigint;
  v_active_count bigint;
  v_empty_count bigint;
  v_archived_count bigint;
  v_filtered_count bigint;
  v_groups jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select
    count(*),
    count(*) filter (where g.archived_at is null and exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null)),
    count(*) filter (where g.archived_at is null and not exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null)),
    count(*) filter (where g.archived_at is not null)
  into v_total_count, v_active_count, v_empty_count, v_archived_count
  from public.groups g;

  select count(*)
  into v_filtered_count
  from public.groups g
  left join public.profiles p on p.id = g.created_by
  left join auth.users u on u.id = g.created_by
  where (v_status = 'all'
      or (v_status = 'active' and g.archived_at is null and exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null))
      or (v_status = 'empty' and g.archived_at is null and not exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null))
      or (v_status = 'archived' and g.archived_at is not null))
    and (v_search = ''
      or lower(coalesce(g.name, '')) like '%' || v_search || '%'
      or lower(coalesce(p.nickname, '')) like '%' || v_search || '%'
      or lower(coalesce(u.email, '')) like '%' || v_search || '%');

  select coalesce(jsonb_agg(to_jsonb(page_rows) order by page_rows.created_at desc, page_rows.id), '[]'::jsonb)
  into v_groups
  from (
    select
      g.id,
      g.name::text as name,
      coalesce(g.group_type, 'custom')::text as group_type,
      g.created_at,
      g.archived_at,
      g.created_by,
      p.nickname::text as owner_nickname,
      u.email::text as owner_email,
      (select count(distinct gm.user_id)::bigint
       from public.group_members gm where gm.group_id = g.id and gm.user_id is not null) as member_count
    from public.groups g
    left join public.profiles p on p.id = g.created_by
    left join auth.users u on u.id = g.created_by
    where (v_status = 'all'
        or (v_status = 'active' and g.archived_at is null and exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null))
        or (v_status = 'empty' and g.archived_at is null and not exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id is not null))
        or (v_status = 'archived' and g.archived_at is not null))
      and (v_search = ''
        or lower(coalesce(g.name, '')) like '%' || v_search || '%'
        or lower(coalesce(p.nickname, '')) like '%' || v_search || '%'
        or lower(coalesce(u.email, '')) like '%' || v_search || '%')
    order by g.created_at desc, g.id
    limit v_page_size
    offset (v_page - 1) * v_page_size
  ) page_rows;

  perform public.write_jellian_admin_activity(
    'group_list_view',
    'groups',
    null,
    '모임 목록 조회',
    jsonb_build_object('page', v_page, 'page_size', v_page_size, 'search', v_search, 'status', v_status)
  );

  return jsonb_build_object(
    'total_count', v_total_count,
    'active_count', v_active_count,
    'empty_count', v_empty_count,
    'archived_count', v_archived_count,
    'filtered_count', v_filtered_count,
    'page', v_page,
    'page_size', v_page_size,
    'groups', v_groups
  );
end;
$$;

revoke all on function public.get_jellian_admin_groups_page(integer, integer, text, text) from public, anon;
grant execute on function public.get_jellian_admin_groups_page(integer, integer, text, text) to authenticated;
