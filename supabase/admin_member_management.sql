-- Jellian 관리자 회원 관리 권한
-- Supabase SQL Editor에서 실행하세요.
-- 최초 관리자는 sangbeom0301@gmail.com 계정으로 지정됩니다.

create table if not exists public.jellian_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.jellian_admins enable row level security;

-- 관리자 여부 확인: 클라이언트가 관리자 목록 테이블을 직접 조회하지 못하게 함
create or replace function public.is_jellian_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jellian_admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_jellian_admin() from public;
grant execute on function public.is_jellian_admin() to authenticated;

-- 회원 목록은 관리자에게만 반환
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

-- 지정한 구글 로그인 이메일의 기존 계정을 최초 관리자로 등록
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('sangbeom0301@gmail.com')
  limit 1;

  if target_user_id is null then
    raise exception 'sangbeom0301@gmail.com 계정을 찾을 수 없습니다. 해당 계정으로 먼저 Jellian에 로그인한 뒤 SQL을 다시 실행하세요.';
  end if;

  insert into public.jellian_admins (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end;
$$;
