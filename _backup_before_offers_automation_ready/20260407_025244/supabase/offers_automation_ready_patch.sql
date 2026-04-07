create extension if not exists pgcrypto;

create table if not exists public.offer_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_name text not null,
  source_type text not null default 'manual',
  base_url text,
  enabled boolean not null default true,
  requires_review boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offer_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.offer_sources(id) on delete set null,
  source_key text,
  run_status text not null default 'queued',
  imported_count integer not null default 0,
  changed_count integer not null default 0,
  failed_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  bookmaker_key text not null,
  bookmaker_name text not null,
  offer_type text not null default 'welcome',
  headline text not null,
  short_description text,
  stake_requirement text,
  reward_value text,
  reward_type text,
  min_odds text,
  qualifying_instructions text,
  region text not null default 'uk',
  affiliate_url text,
  source_id uuid references public.offer_sources(id) on delete set null,
  source_key text,
  source_url text,
  source_last_seen_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'draft',
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  last_change_summary text,
  sort_priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offer_change_log (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  changed_by_user_id uuid references public.profiles(id) on delete set null,
  change_type text not null default 'updated',
  summary text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.offers
  drop constraint if exists offers_offer_type_check;
alter table public.offers
  add constraint offers_offer_type_check
  check (offer_type in ('welcome','reload','bonus','free_bet','cashback','enhanced_odds','other'));

alter table public.offers
  drop constraint if exists offers_status_check;
alter table public.offers
  add constraint offers_status_check
  check (status in ('draft','active','expired','paused','archived'));

alter table public.offer_import_runs
  drop constraint if exists offer_import_runs_status_check;
alter table public.offer_import_runs
  add constraint offer_import_runs_status_check
  check (run_status in ('queued','running','completed','failed'));

alter table public.offer_sources enable row level security;
alter table public.offer_import_runs enable row level security;
alter table public.offers enable row level security;
alter table public.offer_change_log enable row level security;

drop policy if exists offer_sources_public_read on public.offer_sources;
create policy offer_sources_public_read
on public.offer_sources
for select
using (true);

drop policy if exists offer_sources_admin_write on public.offer_sources;
create policy offer_sources_admin_write
on public.offer_sources
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists offer_import_runs_admin_only on public.offer_import_runs;
create policy offer_import_runs_admin_only
on public.offer_import_runs
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists offers_public_read on public.offers;
create policy offers_public_read
on public.offers
for select
using (
  status = 'active'
  or public.is_platform_admin()
);

drop policy if exists offers_admin_write on public.offers;
create policy offers_admin_write
on public.offers
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists offer_change_log_admin_read on public.offer_change_log;
create policy offer_change_log_admin_read
on public.offer_change_log
for select
using (public.is_platform_admin());

drop policy if exists offer_change_log_admin_write on public.offer_change_log;
create policy offer_change_log_admin_write
on public.offer_change_log
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create or replace function public.touch_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists offer_sources_touch_updated_at on public.offer_sources;
create trigger offer_sources_touch_updated_at
before update on public.offer_sources
for each row execute procedure public.touch_generic_updated_at();

drop trigger if exists offers_touch_updated_at on public.offers;
create trigger offers_touch_updated_at
before update on public.offers
for each row execute procedure public.touch_generic_updated_at();

create index if not exists offers_status_region_idx
on public.offers (status, region, offer_type, sort_priority, created_at desc);

create index if not exists offers_bookmaker_idx
on public.offers (bookmaker_key, status, expires_at);

insert into public.offer_sources (source_key, source_name, source_type, requires_review, notes)
values
  ('manual_admin', 'Manual Admin Entry', 'manual', true, 'Primary launch-safe source'),
  ('future_feed', 'Future Feed Import', 'feed', true, 'Reserved for affiliate or promo feed integration')
on conflict (source_key) do nothing;

insert into public.offers (
  bookmaker_key,
  bookmaker_name,
  offer_type,
  headline,
  short_description,
  stake_requirement,
  reward_value,
  reward_type,
  min_odds,
  qualifying_instructions,
  region,
  affiliate_url,
  source_key,
  status,
  last_change_summary,
  sort_priority
)
select * from (
  values
    (
      'bet365',
      'bet365',
      'welcome',
      'Welcome offer placeholder',
      'Replace this with the live welcome offer details once verified.',
      'Qualifying details to be confirmed',
      'Reward to be confirmed',
      'bonus',
      'Any minimum odds requirement to be confirmed',
      'Use controlled qualifying stakes and verify all bookmaker terms before placing.',
      'uk',
      null,
      'manual_admin',
      'draft',
      'Initial placeholder seeded by offers automation patch',
      10
    ),
    (
      'skybet',
      'Sky Bet',
      'reload',
      'Reload offer placeholder',
      'Replace this with a verified reload offer once reviewed.',
      'Reload requirement to be confirmed',
      'Reward to be confirmed',
      'free_bet',
      'Any minimum odds requirement to be confirmed',
      'Review eligibility, expiry, and stake rules before publishing.',
      'uk',
      null,
      'manual_admin',
      'draft',
      'Initial placeholder seeded by offers automation patch',
      20
    )
) as seeded (
  bookmaker_key,
  bookmaker_name,
  offer_type,
  headline,
  short_description,
  stake_requirement,
  reward_value,
  reward_type,
  min_odds,
  qualifying_instructions,
  region,
  affiliate_url,
  source_key,
  status,
  last_change_summary,
  sort_priority
)
where not exists (select 1 from public.offers);