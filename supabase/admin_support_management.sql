-- Jellian 문의 및 오류 제보 관리
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  contact_email text,
  category text not null default 'general'
    check (category in ('general', 'bug', 'account', 'data', 'suggestion', 'other')),
  subject text not null
    check (char_length(trim(subject)) between 1 and 120),
  content text not null
    check (char_length(trim(content)) between 1 and 5000),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'completed')),
  admin_response text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_created_idx
  on public.support_requests (status, created_at desc);
create index if not exists support_requests_user_created_idx
  on public.support_requests (user_id, created_at desc);

create table if not exists public.support_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists support_request_events_request_created_idx
  on public.support_request_events (request_id, created_at desc);

alter table public.support_requests enable row level security;
alter table public.support_request_events enable row level security;

drop policy if exists "Users can submit support requests" on public.support_requests;
create policy "Users can submit support requests"
  on public.support_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own support requests" on public.support_requests;
create policy "Users can read own support requests"
  on public.support_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage support requests" on public.support_requests;
create policy "Admins can manage support requests"
  on public.support_requests for all
  to authenticated
  using (public.is_jellian_admin())
  with check (public.is_jellian_admin());

drop policy if exists "Admins can read support request events" on public.support_request_events;
create policy "Admins can read support request events"
  on public.support_request_events for select
  to authenticated
  using (public.is_jellian_admin());

drop policy if exists "Admins can add support request events" on public.support_request_events;
create policy "Admins can add support request events"
  on public.support_request_events for insert
  to authenticated
  with check (public.is_jellian_admin());

grant select, insert on public.support_requests to authenticated;
grant update on public.support_requests to authenticated;
grant select, insert on public.support_request_events to authenticated;

-- 관리자 전용 문의 목록. 회원 이메일과 닉네임을 함께 반환합니다.
create or replace function public.get_jellian_admin_support_requests()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  nickname text,
  contact_email text,
  category text,
  subject text,
  content text,
  status text,
  admin_response text,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
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
    s.id,
    s.user_id,
    u.email::text,
    p.nickname::text,
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
  order by
    case s.status when 'received' then 0 when 'in_progress' then 1 else 2 end,
    s.created_at desc;
end;
$$;

revoke all on function public.get_jellian_admin_support_requests() from public;
grant execute on function public.get_jellian_admin_support_requests() to authenticated;

-- 상태/답변 변경과 처리 이력을 한 번에 기록합니다.
create or replace function public.update_jellian_admin_support_request(
  p_request_id uuid,
  p_status text,
  p_admin_response text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status text;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_status not in ('received', 'in_progress', 'completed') then
    raise exception '올바르지 않은 처리 상태입니다.';
  end if;

  select status into previous_status
  from public.support_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception '문의 내역을 찾을 수 없습니다.';
  end if;

  update public.support_requests
  set status = p_status,
      admin_response = nullif(trim(coalesce(p_admin_response, '')), ''),
      handled_by = auth.uid(),
      handled_at = case when p_status = 'completed' then now() else null end,
      updated_at = now()
  where id = p_request_id;

  insert into public.support_request_events (
    request_id, actor_id, event_type, old_status, new_status, note
  ) values (
    p_request_id,
    auth.uid(),
    'admin_update',
    previous_status,
    p_status,
    nullif(trim(coalesce(p_admin_response, '')), '')
  );
end;
$$;

revoke all on function public.update_jellian_admin_support_request(uuid, text, text) from public;
grant execute on function public.update_jellian_admin_support_request(uuid, text, text) to authenticated;
