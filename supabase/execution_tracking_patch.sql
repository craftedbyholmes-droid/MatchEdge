create table if not exists public.user_execution_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text,
  event_name text,
  bookmaker text,
  stake numeric(12,2) not null default 0,
  odds numeric(12,4) not null default 0,
  potential_return numeric(12,2) not null default 0,
  actual_profit numeric(12,2),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_execution_log_status_check check (status in ('pending','settled','void','cancelled'))
);

alter table public.user_execution_log enable row level security;

drop policy if exists execution_log_self_manage on public.user_execution_log;
create policy execution_log_self_manage on public.user_execution_log
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

create or replace function public.touch_user_execution_log_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_execution_log_touch_updated_at on public.user_execution_log;
create trigger user_execution_log_touch_updated_at
before update on public.user_execution_log
for each row execute procedure public.touch_user_execution_log_updated_at();