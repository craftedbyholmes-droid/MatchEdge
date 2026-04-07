create table if not exists public.subscription_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier_key text not null default 'free',
  affiliate_clicks_count integer not null default 0,
  affiliate_conversions_count integer not null default 0,
  premium_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_click_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  bookmaker_key text not null,
  bookmaker_name text not null,
  destination_url text not null,
  source_page text,
  opportunity_id text,
  clicked_at timestamptz not null default now()
);

alter table public.subscription_profiles enable row level security;
alter table public.affiliate_click_log enable row level security;

drop policy if exists subscription_profiles_self_read on public.subscription_profiles;
create policy subscription_profiles_self_read on public.subscription_profiles
for select using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists subscription_profiles_self_insert on public.subscription_profiles;
create policy subscription_profiles_self_insert on public.subscription_profiles
for insert with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists subscription_profiles_self_update on public.subscription_profiles;
create policy subscription_profiles_self_update on public.subscription_profiles
for update using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists affiliate_click_log_self_read on public.affiliate_click_log;
create policy affiliate_click_log_self_read on public.affiliate_click_log
for select using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists affiliate_click_log_insert on public.affiliate_click_log;
create policy affiliate_click_log_insert on public.affiliate_click_log
for insert with check (auth.uid() = user_id or public.is_platform_admin() or user_id is null);

create or replace function public.touch_subscription_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscription_profiles_touch_updated_at on public.subscription_profiles;
create trigger subscription_profiles_touch_updated_at
before update on public.subscription_profiles
for each row execute procedure public.touch_subscription_profiles_updated_at();

create or replace function public.increment_affiliate_click_counter_safe(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscription_profiles (user_id, tier_key, affiliate_clicks_count)
  values (target_user_id, 'free', 1)
  on conflict (user_id)
  do update set affiliate_clicks_count = public.subscription_profiles.affiliate_clicks_count + 1;
end;
$$;