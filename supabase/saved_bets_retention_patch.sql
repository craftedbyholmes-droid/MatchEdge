create table if not exists public.saved_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  execution_log_id uuid references public.user_execution_log(id) on delete set null,
  opportunity_id text,
  event_name text not null,
  event_date timestamptz,
  outcome_summary text,
  bookmaker_names text[],
  amount_staked numeric(12,2) default 0,
  amount_returned numeric(12,2) default 0,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_bets enable row level security;

drop policy if exists saved_bets_owner_read on public.saved_bets;
create policy saved_bets_owner_read
on public.saved_bets
for select
using (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists saved_bets_owner_write on public.saved_bets;
create policy saved_bets_owner_write
on public.saved_bets
for all
using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

create or replace function public.touch_saved_bets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_bets_touch_updated_at on public.saved_bets;
create trigger saved_bets_touch_updated_at
before update on public.saved_bets
for each row execute procedure public.touch_saved_bets_updated_at();

create or replace function public.sync_saved_bet_from_execution()
returns trigger
language plpgsql
as $$
declare
  existing_id uuid;
begin
  if new.status = 'pending' then
    insert into public.saved_bets (
      user_id,
      execution_log_id,
      opportunity_id,
      event_name,
      outcome_summary,
      bookmaker_names,
      amount_staked,
      amount_returned,
      status
    )
    values (
      new.user_id,
      new.id,
      new.opportunity_id,
      coalesce(new.event_name, 'Tracked selection'),
      coalesce(new.notes, ''),
      new.bookmaker_names,
      coalesce(new.amount_staked, 0),
      coalesce(new.amount_returned, 0),
      'active'
    )
    on conflict do nothing;

    return new;
  end if;

  select id
  into existing_id
  from public.saved_bets
  where execution_log_id = new.id
  limit 1;

  if existing_id is not null then
    update public.saved_bets
    set
      amount_returned = coalesce(new.amount_returned, amount_returned),
      bookmaker_names = coalesce(new.bookmaker_names, bookmaker_names),
      outcome_summary = coalesce(new.notes, outcome_summary),
      archived_at = case
        when new.status in ('settled','void','cancelled') then coalesce(archived_at, now() + interval '24 hours')
        else archived_at
      end,
      status = case
        when new.status in ('settled','void','cancelled') then 'ending'
        else status
      end
    where id = existing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_saved_bet_from_execution_insert on public.user_execution_log;
create trigger sync_saved_bet_from_execution_insert
after insert on public.user_execution_log
for each row execute procedure public.sync_saved_bet_from_execution();

drop trigger if exists sync_saved_bet_from_execution_update on public.user_execution_log;
create trigger sync_saved_bet_from_execution_update
after update on public.user_execution_log
for each row execute procedure public.sync_saved_bet_from_execution();

create or replace function public.archive_expired_saved_bets()
returns bigint
language plpgsql
as $$
declare
  affected_count bigint;
begin
  update public.saved_bets
  set status = 'archived',
      updated_at = now()
  where status = 'ending'
    and archived_at is not null
    and archived_at <= now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;