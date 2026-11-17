-- Jellian 관리자 데이터 복원 안전성 강화
-- Supabase SQL Editor에서 실행하세요.
-- 기존 데이터 삭제 전 백업 JSON의 최상위 구조와 모든 행의 자료형을 검증합니다.
-- 실제 복원은 단일 트랜잭션이며, 오류 발생 시 전체 변경이 롤백됩니다.

create or replace function public.restore_jellian_admin_data_backup(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  required_key text;
  invalid_item boolean;
  result jsonb;
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_backup is null or jsonb_typeof(p_backup) <> 'object' then
    raise exception '올바른 JSON 백업 파일이 아닙니다.';
  end if;

  if jsonb_typeof(p_backup -> 'exported_at') <> 'string' then
    raise exception '백업 생성 시각이 없거나 올바르지 않습니다.';
  end if;

  begin
    perform (p_backup ->> 'exported_at')::timestamptz;
  exception when others then
    raise exception '백업 생성 시각을 날짜로 변환할 수 없습니다.';
  end;

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

    select exists (
      select 1
      from jsonb_array_elements(p_backup -> required_key) as row_data(value)
      where jsonb_typeof(row_data.value) <> 'object'
    ) into invalid_item;

    if invalid_item then
      raise exception '백업 파일의 % 데이터에 객체가 아닌 항목이 포함되어 있습니다.', required_key;
    end if;
  end loop;

  -- 모든 검증을 마친 뒤 자식 테이블부터 비웁니다.
  delete from public.transactions;
  delete from public.budgets;
  delete from public.categories;
  delete from public.group_members;
  delete from public.groups;

  -- 부모 테이블부터 복원합니다. 컬럼 타입/제약조건 오류가 발생하면 트랜잭션 전체가 롤백됩니다.
  insert into public.groups
  select * from jsonb_populate_recordset(null::public.groups, p_backup -> 'groups');

  insert into public.group_members
  select * from jsonb_populate_recordset(null::public.group_members, p_backup -> 'group_members');

  insert into public.categories
  select * from jsonb_populate_recordset(null::public.categories, p_backup -> 'categories');

  insert into public.budgets
  select * from jsonb_populate_recordset(null::public.budgets, p_backup -> 'budgets');

  insert into public.transactions
  select * from jsonb_populate_recordset(null::public.transactions, p_backup -> 'transactions');

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

revoke all on function public.restore_jellian_admin_data_backup(jsonb) from public, anon;
grant execute on function public.restore_jellian_admin_data_backup(jsonb) to authenticated;
