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
  is_active boolean not null default true
);

alter table public.admin_plan_grants
  drop constraint if exists admin_plan_grants_plan_key_check;
alter table public.admin_plan_grants
  add constraint admin_plan_grants_plan_key_check
  check (plan_key in ('free','premium','pro'));

alter table public.admin_plan_grants
  drop constraint if exists admin_plan_grants_access_type_check;
alter table public.admin_plan_grants
  add constraint admin_plan_grants_access_type_check
  check (access_type in ('permanent','time_limited'));

with ranked as (
  select
    id,
    user_id,
    row_number() over (
      partition by user_id
      order by starts_at desc, created_at desc, id desc
    ) as rn
  from public.admin_plan_grants
  where is_active = true
)
update public.admin_plan_grants g
set is_active = false,
    updated_at = now()
from ranked r
where g.id = r.id
  and r.rn > 1;

create index if not exists admin_plan_grants_user_active_idx
on public.admin_plan_grants (user_id, is_active, starts_at desc, created_at desc);

drop index if exists admin_plan_grants_one_active_per_user;
create unique index admin_plan_grants_one_active_per_user
on public.admin_plan_grants (user_id)
where is_active = true;

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

alter table public.admin_plan_grants enable row level security;

drop policy if exists admin_plan_grants_admin_read on public.admin_plan_grants;
create policy admin_plan_grants_admin_read
on public.admin_plan_grants
for select
using (public.is_platform_admin());

drop policy if exists admin_plan_grants_admin_write on public.admin_plan_grants;
create policy admin_plan_grants_admin_write
on public.admin_plan_grants
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop view if exists public.active_admin_plan_grants;
create view public.active_admin_plan_grants
with (security_invoker = true) as
select *
from public.admin_plan_grants
where is_active = true
  and starts_at <= now()
  and (
    access_type = 'permanent'
    or expires_at is null
    or expires_at >= now()
  );

create or replace function public.get_effective_plan_key(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_plan text;
begin
  select apg.plan_key
  into resolved_plan
  from public.admin_plan_grants apg
  where apg.user_id = target_user_id
    and apg.is_active = true
    and apg.starts_at <= now()
    and (
      apg.access_type = 'permanent'
      or apg.expires_at is null
      or apg.expires_at >= now()
    )
  order by apg.starts_at desc, apg.created_at desc, apg.id desc
  limit 1;

  return lower(coalesce(resolved_plan, 'free'));
end;
$$;

grant execute on function public.get_effective_plan_key(uuid) to authenticated;
grant execute on function public.get_effective_plan_key(uuid) to service_role;