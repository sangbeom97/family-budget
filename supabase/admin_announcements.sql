-- Jellian 공지사항 테이블 및 접근 정책
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_length check (char_length(trim(title)) between 1 and 120),
  constraint announcements_content_length check (char_length(trim(content)) between 1 and 10000)
);

create index if not exists announcements_published_created_idx
  on public.announcements (is_published, created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "Published announcements are readable" on public.announcements;
create policy "Published announcements are readable"
  on public.announcements for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  to authenticated
  using (public.is_jellian_admin())
  with check (public.is_jellian_admin());

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
