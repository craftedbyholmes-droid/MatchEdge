alter table public.user_execution_log
  add column if not exists bookmaker_keys text[],
  add column if not exists bookmaker_names text[],
  add column if not exists amount_staked numeric(12,2),
  add column if not exists amount_returned numeric(12,2),
  add column if not exists execution_source text,
  add column if not exists opportunity_kind text,
  add column if not exists notes text,
  add column if not exists settled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.user_execution_log
set amount_staked = coalesce(amount_staked, stake, 0)
where amount_staked is null;

update public.user_execution_log
set amount_returned = coalesce(amount_returned, potential_return, 0)
where amount_returned is null;

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