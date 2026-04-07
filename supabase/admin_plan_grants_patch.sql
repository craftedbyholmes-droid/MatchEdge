create table if not exists public.admin_plan_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  granted_by_user_id uuid references public.profiles(id) on delete set null,
  plan_key text not null,
  access_type text not null default 'permanent',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint admin_plan_grants_access_type_check check (access_type in ('permanent','time_limited')),
  constraint admin_plan_grants_plan_key_check check (plan_key in ('free','premium','pro'))
);

create index if not exists admin_plan_grants_user_active_idx
  on public.admin_plan_grants (user_id, is_active, starts_at desc);

alter table public.admin_plan_grants enable row level security;

drop policy if exists admin_plan_grants_self_read on public.admin_plan_grants;
create policy admin_plan_grants_self_read on public.admin_plan_grants
for select using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists admin_plan_grants_admin_insert on public.admin_plan_grants;
create policy admin_plan_grants_admin_insert on public.admin_plan_grants
for insert with check (public.is_platform_admin());

drop policy if exists admin_plan_grants_admin_update on public.admin_plan_grants;
create policy admin_plan_grants_admin_update on public.admin_plan_grants
for update using (public.is_platform_admin())
with check (public.is_platform_admin());

create or replace function public.touch_admin_plan_grants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_plan_grants_touch_updated_at on public.admin_plan_grants;
create trigger admin_plan_grants_touch_updated_at
before update on public.admin_plan_grants
for each row execute procedure public.touch_admin_plan_grants_updated_at();

create or replace view public.active_admin_plan_grants
with (security_invoker = true) as
select
  g.*
from public.admin_plan_grants g
where g.is_active = true
  and g.starts_at <= now()
  and (g.expires_at is null or g.expires_at > now());

grant select on public.active_admin_plan_grants to authenticated;

create or replace function public.get_effective_plan_key(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_plan text;
  billing_plan text;
begin
  select g.plan_key
  into admin_plan
  from public.active_admin_plan_grants g
  where g.user_id = target_user_id
  order by
    case g.plan_key
      when 'pro' then 3
      when 'premium' then 2
      else 1
    end desc,
    g.created_at desc
  limit 1;

  if admin_plan is not null then
    return admin_plan;
  end if;

  select coalesce(bp.current_plan_key, sp.tier_key, 'free')
  into billing_plan
  from public.subscription_profiles sp
  left join public.billing_profiles bp
    on bp.user_id = sp.user_id
  where sp.user_id = target_user_id
  limit 1;

  return coalesce(billing_plan, 'free');
end;
$$;