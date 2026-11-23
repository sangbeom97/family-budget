-- Jellian 고객지원 첨부파일
-- 전용 비공개 버킷: JPG / PNG / WEBP, 파일당 최대 5MB
-- 기존 문의 및 처리 이력은 변경하지 않습니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

create table if not exists public.support_request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null
    check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null
    check (file_size between 1 and 5242880),
  created_at timestamptz not null default now()
);

create index if not exists support_request_attachments_request_idx
  on public.support_request_attachments (request_id, created_at);

alter table public.support_request_attachments enable row level security;

drop policy if exists "Users can read own support attachments" on public.support_request_attachments;
create policy "Users can read own support attachments"
  on public.support_request_attachments
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read support attachments" on public.support_request_attachments;
create policy "Admins can read support attachments"
  on public.support_request_attachments
  for select to authenticated
  using (public.is_jellian_admin());

drop policy if exists "Users can add attachments to own support requests" on public.support_request_attachments;
create policy "Users can add attachments to own support requests"
  on public.support_request_attachments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.support_requests s
      where s.id = request_id
        and s.user_id = auth.uid()
    )
  );

grant select, insert on public.support_request_attachments to authenticated;

drop policy if exists "Users can upload own support attachment files" on storage.objects;
create policy "Users can upload own support attachment files"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.support_requests s
      where s.id::text = (storage.foldername(name))[2]
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "Users and admins can read support attachment files" on storage.objects;
create policy "Users and admins can read support attachment files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_jellian_admin()
    )
  );

drop policy if exists "Users can delete own support attachment files" on storage.objects;
create policy "Users can delete own support attachment files"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'support-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
