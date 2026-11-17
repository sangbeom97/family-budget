-- Jellian 관리자 회원·모임 조회 이력 확장
-- Supabase SQL Editor에서 실행하세요.
-- 회원·모임 데이터는 변경하지 않으며, 관리자 목록 조회만 작업 이력에 남깁니다.

create or replace function public.get_jellian_admin_members()
returns table (
  id uuid,
  email text,
  nickname text,
  created_at timestamptz,
  group_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  perform public.write_jellian_admin_activity(
    'member_list_view',
    'members',
    null,
    '회원 목록 조회',
    '{}'::jsonb
  );

  return query
  select
    u.id,
    u.email::text,
    p.nickname::text,
    u.created_at,
    count(distinct gm.group_id)::bigint
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.group_members gm on gm.user_id = u.id
  group by u.id, u.email, p.nickname, u.created_at
  order by u.created_at desc;
end;
$$;

revoke all on function public.get_jellian_admin_members() from public;
grant execute on function public.get_jellian_admin_members() to authenticated;

create or replace function public.get_jellian_admin_groups()
returns table (
  id uuid,
  name text,
  group_type text,
  created_at timestamptz,
  archived_at timestamptz,
  created_by uuid,
  owner_nickname text,
  owner_email text,
  member_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  perform public.write_jellian_admin_activity(
    'group_list_view',
    'groups',
    null,
    '모임 목록 조회',
    '{}'::jsonb
  );

  return query
  select
    g.id,
    g.name::text,
    coalesce(g.group_type, 'custom')::text,
    g.created_at,
    g.archived_at,
    g.created_by,
    p.nickname::text,
    u.email::text,
    count(distinct gm.user_id)::bigint
  from public.groups g
  left join public.profiles p on p.id = g.created_by
  left join auth.users u on u.id = g.created_by
  left join public.group_members gm on gm.group_id = g.id
  group by g.id, g.name, g.group_type, g.created_at, g.archived_at,
           g.created_by, p.nickname, u.email
  order by g.created_at desc;
end;
$$;

revoke all on function public.get_jellian_admin_groups() from public;
grant execute on function public.get_jellian_admin_groups() to authenticated;
