-- Jellian: distinguish household, club, trip/project, and custom shared budgets.
alter table public.groups
  add column if not exists group_type text not null default 'custom';

alter table public.groups
  drop constraint if exists groups_group_type_check;

alter table public.groups
  add constraint groups_group_type_check
  check (group_type in ('household', 'club', 'trip', 'custom'));
