alter table public.platform_config
  add column if not exists refresh_mode text not null default 'hourly',
  add column if not exists refresh_interval_minutes integer not null default 60,
  add column if not exists last_data_refresh_at timestamptz,
  add column if not exists last_data_refresh_status text,
  add column if not exists last_data_refresh_note text;

create table if not exists public.provider_cache_snapshots (
  cache_key text primary key,
  payload jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  provider_name text not null default 'the_odds_api',
  status text not null default 'ok',
  note text
);

alter table public.provider_cache_snapshots enable row level security;

drop policy if exists provider_cache_snapshots_admin_read on public.provider_cache_snapshots;
create policy provider_cache_snapshots_admin_read on public.provider_cache_snapshots
for select using (public.is_platform_admin());

drop policy if exists provider_cache_snapshots_admin_write on public.provider_cache_snapshots;
create policy provider_cache_snapshots_admin_write on public.provider_cache_snapshots
for all using (public.is_platform_admin())
with check (public.is_platform_admin());

update public.platform_config
set refresh_mode = coalesce(refresh_mode, 'hourly'),
    refresh_interval_minutes = coalesce(refresh_interval_minutes, 60)
where true;