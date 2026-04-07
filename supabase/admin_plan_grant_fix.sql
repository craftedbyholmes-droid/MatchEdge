-- 1) Deactivate all but the newest active grant per user
with ranked as (
  select
    id,
    user_id,
    row_number() over (
      partition by user_id
      order by created_at desc, id desc
    ) as rn
  from public.admin_plan_grants
  where is_active = true
)
update public.admin_plan_grants g
set is_active = false
from ranked r
where g.id = r.id
  and r.rn > 1;

-- 2) Helpful index for plan resolution and admin views
create index if not exists admin_plan_grants_user_active_idx
on public.admin_plan_grants (user_id, is_active, created_at desc);

-- 3) Hard safeguard: only one active grant per user
drop index if exists admin_plan_grants_one_active_per_user;
create unique index admin_plan_grants_one_active_per_user
on public.admin_plan_grants (user_id)
where is_active = true;

-- 4) Rebuild effective-plan function to prefer active admin grant first,
--    then fall back to billing, else free
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
  select apg.plan_key
  into admin_plan
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

  if admin_plan is not null then
    return lower(admin_plan);
  end if;

  select bp.current_plan_key
  into billing_plan
  from public.billing_profiles bp
  where bp.user_id = target_user_id
  order by bp.updated_at desc nulls last, bp.created_at desc nulls last, bp.id desc
  limit 1;

  if billing_plan is not null then
    return lower(billing_plan);
  end if;

  return 'free';
end;
$$;

grant execute on function public.get_effective_plan_key(uuid) to authenticated;
grant execute on function public.get_effective_plan_key(uuid) to service_role;

-- 5) Quick diagnostic view
create or replace view public.active_admin_plan_grants as
select *
from public.admin_plan_grants
where is_active = true;