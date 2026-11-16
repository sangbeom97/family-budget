-- Jellian: 보관된 모임 조회 및 복구
-- Supabase SQL Editor에서 한 번 실행하세요.

create or replace function public.get_my_archived_groups()
returns table (
  id uuid,
  name text,
  group_type text,
  archived_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, g.group_type, g.archived_at
  from public.groups g
  where g.created_by = auth.uid()
    and g.archived_at is not null
  order by g.archived_at desc;
$$;

revoke all on function public.get_my_archived_groups() from public;
grant execute on function public.get_my_archived_groups() to authenticated;

create or replace function public.restore_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.groups
  set archived_at = null
  where id = p_group_id
    and created_by = auth.uid()
    and archived_at is not null;

  if not found then
    raise exception '복구할 수 있는 보관된 모임이 없습니다.';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, auth.uid(), 'owner')
  on conflict (group_id, user_id)
  do update set role = 'owner';
end;
$$;

revoke all on function public.restore_group(uuid) from public;
grant execute on function public.restore_group(uuid) to authenticated;
