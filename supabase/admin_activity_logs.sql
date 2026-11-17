-- Jellian 관리자 작업 이력
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_idx
  on public.admin_activity_logs (created_at desc);
create index if not exists admin_activity_logs_action_created_idx
  on public.admin_activity_logs (action, created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "Admins can read activity logs" on public.admin_activity_logs;
create policy "Admins can read activity logs"
  on public.admin_activity_logs for select
  to authenticated
  using (public.is_jellian_admin());

revoke all on public.admin_activity_logs from anon, authenticated;
grant select on public.admin_activity_logs to authenticated;

-- 관리자 작업을 기록하는 내부 함수. 일반 사용자의 직접 실행은 차단합니다.
create or replace function public.write_jellian_admin_activity(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_summary text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  insert into public.admin_activity_logs (
    actor_id, action, target_type, target_id, summary, details
  ) values (
    auth.uid(),
    p_action,
    p_target_type,
    nullif(p_target_id, ''),
    p_summary,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.write_jellian_admin_activity(text, text, text, text, jsonb) from public, anon, authenticated;

-- 공지사항 생성·수정·삭제 자동 기록
create or replace function public.log_jellian_admin_announcement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_id text;
  item_title text;
  action_name text;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'DELETE' then
    item := to_jsonb(old);
    item_id := old.id::text;
    item_title := old.title;
    action_name := 'notice_delete';
  elsif tg_op = 'INSERT' then
    item := to_jsonb(new);
    item_id := new.id::text;
    item_title := new.title;
    action_name := 'notice_create';
  else
    item := to_jsonb(new);
    item_id := new.id::text;
    item_title := new.title;
    action_name := 'notice_update';
  end if;

  perform public.write_jellian_admin_activity(
    action_name,
    'announcement',
    item_id,
    case action_name
      when 'notice_create' then '공지사항 등록: ' || coalesce(item_title, '')
      when 'notice_update' then '공지사항 수정: ' || coalesce(item_title, '')
      else '공지사항 삭제: ' || coalesce(item_title, '')
    end,
    jsonb_build_object('title', item_title, 'is_published', item -> 'is_published')
  );

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists jellian_admin_announcement_activity on public.announcements;
create trigger jellian_admin_announcement_activity
after insert or update or delete on public.announcements
for each row execute function public.log_jellian_admin_announcement_change();

-- 백업 실행 이력
create or replace function public.get_jellian_admin_data_backup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  result := jsonb_build_object(
    'exported_at', now(),
    'groups', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at) from public.groups g), '[]'::jsonb),
    'group_members', coalesce((select jsonb_agg(to_jsonb(gm)) from public.group_members gm), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(to_jsonb(c)) from public.categories c), '[]'::jsonb),
    'budgets', coalesce((select jsonb_agg(to_jsonb(b)) from public.budgets b), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) order by t.date, t.id) from public.transactions t), '[]'::jsonb)
  );

  perform public.write_jellian_admin_activity(
    'data_backup', 'database', null, '전체 데이터 백업 다운로드',
    jsonb_build_object(
      'groups', jsonb_array_length(result -> 'groups'),
      'group_members', jsonb_array_length(result -> 'group_members'),
      'categories', jsonb_array_length(result -> 'categories'),
      'budgets', jsonb_array_length(result -> 'budgets'),
      'transactions', jsonb_array_length(result -> 'transactions')
    )
  );

  return result;
end;
$$;

revoke all on function public.get_jellian_admin_data_backup() from public;
grant execute on function public.get_jellian_admin_data_backup() to authenticated;

-- 데이터 복원 이력. 복원과 이력 기록은 같은 트랜잭션으로 처리됩니다.
create or replace function public.restore_jellian_admin_data_backup(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  required_key text;
  result jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_backup is null or jsonb_typeof(p_backup) <> 'object' then
    raise exception '올바른 JSON 백업 파일이 아닙니다.';
  end if;

  foreach required_key in array array['groups','group_members','categories','budgets','transactions']
  loop
    if not (p_backup ? required_key) or jsonb_typeof(p_backup -> required_key) <> 'array' then
      raise exception '백업 파일의 % 데이터가 없거나 배열 형식이 아닙니다.', required_key;
    end if;
  end loop;

  delete from public.transactions;
  delete from public.budgets;
  delete from public.categories;
  delete from public.group_members;
  delete from public.groups;

  insert into public.groups select * from jsonb_populate_recordset(null::public.groups, p_backup -> 'groups');
  insert into public.group_members select * from jsonb_populate_recordset(null::public.group_members, p_backup -> 'group_members');
  insert into public.categories select * from jsonb_populate_recordset(null::public.categories, p_backup -> 'categories');
  insert into public.budgets select * from jsonb_populate_recordset(null::public.budgets, p_backup -> 'budgets');
  insert into public.transactions select * from jsonb_populate_recordset(null::public.transactions, p_backup -> 'transactions');

  result := jsonb_build_object(
    'restored_at', now(),
    'groups', jsonb_array_length(p_backup -> 'groups'),
    'group_members', jsonb_array_length(p_backup -> 'group_members'),
    'categories', jsonb_array_length(p_backup -> 'categories'),
    'budgets', jsonb_array_length(p_backup -> 'budgets'),
    'transactions', jsonb_array_length(p_backup -> 'transactions')
  );

  perform public.write_jellian_admin_activity(
    'data_restore', 'database', null, '백업 데이터 복원 실행', result
  );

  return result;
end;
$$;

revoke all on function public.restore_jellian_admin_data_backup(jsonb) from public;
grant execute on function public.restore_jellian_admin_data_backup(jsonb) to authenticated;

-- 문의 처리 이력도 관리자 작업 이력에 함께 남깁니다.
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
  request_subject text;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;
  if p_status not in ('received', 'in_progress', 'completed') then
    raise exception '올바르지 않은 처리 상태입니다.';
  end if;

  select status, subject into previous_status, request_subject
  from public.support_requests where id = p_request_id for update;
  if not found then raise exception '문의 내역을 찾을 수 없습니다.'; end if;

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
    p_request_id, auth.uid(), 'admin_update', previous_status, p_status,
    nullif(trim(coalesce(p_admin_response, '')), '')
  );

  perform public.write_jellian_admin_activity(
    'support_update', 'support_request', p_request_id::text,
    '문의 처리: ' || coalesce(request_subject, ''),
    jsonb_build_object('old_status', previous_status, 'new_status', p_status)
  );
end;
$$;

revoke all on function public.update_jellian_admin_support_request(uuid, text, text) from public;
grant execute on function public.update_jellian_admin_support_request(uuid, text, text) to authenticated;

-- 관리자 작업 이력 조회
create or replace function public.get_jellian_admin_activity_logs(
  p_limit integer default 300
)
returns table (
  id uuid,
  actor_id uuid,
  actor_email text,
  actor_nickname text,
  action text,
  target_type text,
  target_id text,
  summary text,
  details jsonb,
  created_at timestamptz
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
    l.id,
    l.actor_id,
    u.email::text,
    p.nickname::text,
    l.action,
    l.target_type,
    l.target_id,
    l.summary,
    l.details,
    l.created_at
  from public.admin_activity_logs l
  left join auth.users u on u.id = l.actor_id
  left join public.profiles p on p.id = l.actor_id
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 300), 1000));
end;
$$;

revoke all on function public.get_jellian_admin_activity_logs(integer) from public;
grant execute on function public.get_jellian_admin_activity_logs(integer) to authenticated;
