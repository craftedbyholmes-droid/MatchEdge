create extension if not exists pgcrypto;

create table if not exists public.user_contact_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  alert_email text,
  sms_enabled boolean not null default false,
  phone_number text,
  timezone text not null default 'Europe/London',
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_contact_preferences enable row level security;

drop policy if exists user_contact_preferences_owner_read on public.user_contact_preferences;
create policy user_contact_preferences_owner_read
on public.user_contact_preferences
for select
using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists user_contact_preferences_owner_write on public.user_contact_preferences;
create policy user_contact_preferences_owner_write
on public.user_contact_preferences
for all
using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

create or replace function public.touch_user_contact_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_contact_preferences_touch_updated_at on public.user_contact_preferences;
create trigger user_contact_preferences_touch_updated_at
before update on public.user_contact_preferences
for each row execute procedure public.touch_user_contact_preferences_updated_at();

alter table public.alert_rules
  add column if not exists sport_keys text[] default '{}'::text[],
  add column if not exists delivery_in_app boolean not null default true,
  add column if not exists delivery_email boolean not null default false,
  add column if not exists delivery_sms boolean not null default false,
  add column if not exists bookmaker_include text[] default '{}'::text[],
  add column if not exists bookmaker_exclude text[] default '{}'::text[],
  add column if not exists kickoff_window_hours integer,
  add column if not exists cooldown_minutes integer not null default 60,
  add column if not exists trigger_type text not null default 'new_match',
  add column if not exists digest_mode text not null default 'instant',
  add column if not exists quiet_hours_override boolean not null default false,
  add column if not exists last_triggered_at timestamptz;

alter table public.alert_rules
  drop constraint if exists alert_rules_trigger_type_check;
alter table public.alert_rules
  add constraint alert_rules_trigger_type_check
  check (trigger_type in ('new_match','improved_match','profit_jump','bookmaker_match','kickoff_window'));

alter table public.alert_rules
  drop constraint if exists alert_rules_digest_mode_check;
alter table public.alert_rules
  add constraint alert_rules_digest_mode_check
  check (digest_mode in ('instant','hourly_digest','six_hour_digest','daily_digest'));

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  alert_rule_id uuid references public.alert_rules(id) on delete set null,
  event_name text,
  sport_key text,
  trigger_reason text,
  delivery_channel text not null,
  delivery_status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.alert_deliveries enable row level security;

drop policy if exists alert_deliveries_owner_read on public.alert_deliveries;
create policy alert_deliveries_owner_read
on public.alert_deliveries
for select
using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists alert_deliveries_admin_write on public.alert_deliveries;
create policy alert_deliveries_admin_write
on public.alert_deliveries
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create index if not exists alert_rules_user_idx
on public.alert_rules (user_id, enabled, created_at desc);

create index if not exists alert_deliveries_user_idx
on public.alert_deliveries (user_id, created_at desc);