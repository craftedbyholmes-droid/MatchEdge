create table if not exists public.offer_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bookmaker_key text not null,
  bookmaker_name text not null,
  offer_type text not null default 'welcome',
  used_at timestamptz not null default now(),
  notes text
);

create unique index if not exists offer_usage_unique_welcome_per_bookmaker
  on public.offer_usage (user_id, bookmaker_key, offer_type)
  where offer_type = 'welcome';

create table if not exists public.user_execution_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text not null,
  event_name text not null,
  bookmaker_keys text[] not null default array[]::text[],
  bookmaker_names text[] not null default array[]::text[],
  amount_staked numeric(12,2) not null default 0,
  amount_returned numeric(12,2) not null default 0,
  profit_loss numeric(12,2) generated always as (amount_returned - amount_staked) stored,
  is_loss boolean generated always as (amount_returned - amount_staked < 0) stored,
  created_at timestamptz not null default now()
);

alter table public.offer_usage enable row level security;
alter table public.user_execution_log enable row level security;

drop policy if exists offer_usage_self_manage on public.offer_usage;
create policy offer_usage_self_manage on public.offer_usage
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists execution_log_self_manage on public.user_execution_log;
create policy execution_log_self_manage on public.user_execution_log
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());