-- Jellian 관리자 데이터 백업
-- Supabase SQL Editor에서 실행하세요. 원본 데이터는 변경하지 않습니다.

create or replace function public.get_jellian_admin_data_backup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_jellian_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'groups', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at) from public.groups g), '[]'::jsonb),
    'group_members', coalesce((select jsonb_agg(to_jsonb(gm)) from public.group_members gm), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(to_jsonb(c)) from public.categories c), '[]'::jsonb),
    'budgets', coalesce((select jsonb_agg(to_jsonb(b)) from public.budgets b), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) order by t.date, t.id) from public.transactions t), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_jellian_admin_data_backup() from public;
grant execute on function public.get_jellian_admin_data_backup() to authenticated;
