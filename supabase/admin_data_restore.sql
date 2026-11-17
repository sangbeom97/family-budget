-- Jellian 관리자 데이터 복원
-- Supabase SQL Editor에서 실행하세요.
-- 주의: 복원 시 현재 groups, group_members, categories, budgets, transactions 전체가
-- 업로드한 백업 내용으로 교체됩니다. support_requests 및 profiles는 변경하지 않습니다.
-- 함수 실행은 단일 트랜잭션으로 처리되며, 오류 발생 시 전체 변경이 롤백됩니다.

create or replace function public.restore_jellian_admin_data_backup(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  required_key text;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_backup is null or jsonb_typeof(p_backup) <> 'object' then
    raise exception '올바른 JSON 백업 파일이 아닙니다.';
  end if;

  foreach required_key in array array[
    'groups',
    'group_members',
    'categories',
    'budgets',
    'transactions'
  ]
  loop
    if not (p_backup ? required_key)
      or jsonb_typeof(p_backup -> required_key) <> 'array' then
      raise exception '백업 파일의 % 데이터가 없거나 배열 형식이 아닙니다.', required_key;
    end if;
  end loop;

  -- 자식 테이블부터 비운 뒤 부모 테이블부터 복원합니다.
  delete from public.transactions;
  delete from public.budgets;
  delete from public.categories;
  delete from public.group_members;
  delete from public.groups;

  insert into public.groups
  select *
  from jsonb_populate_recordset(null::public.groups, p_backup -> 'groups');

  insert into public.group_members
  select *
  from jsonb_populate_recordset(null::public.group_members, p_backup -> 'group_members');

  insert into public.categories
  select *
  from jsonb_populate_recordset(null::public.categories, p_backup -> 'categories');

  insert into public.budgets
  select *
  from jsonb_populate_recordset(null::public.budgets, p_backup -> 'budgets');

  insert into public.transactions
  select *
  from jsonb_populate_recordset(null::public.transactions, p_backup -> 'transactions');

  return jsonb_build_object(
    'restored_at', now(),
    'groups', jsonb_array_length(p_backup -> 'groups'),
    'group_members', jsonb_array_length(p_backup -> 'group_members'),
    'categories', jsonb_array_length(p_backup -> 'categories'),
    'budgets', jsonb_array_length(p_backup -> 'budgets'),
    'transactions', jsonb_array_length(p_backup -> 'transactions')
  );
end;
$$;

revoke all on function public.restore_jellian_admin_data_backup(jsonb) from public;
grant execute on function public.restore_jellian_admin_data_backup(jsonb) to authenticated;
