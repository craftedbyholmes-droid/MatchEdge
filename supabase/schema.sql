create extension if not exists pgcrypto;

create type public.strategy_mode as enum ('qualifying', 'profit', 'hybrid');
create type public.chat_invite_status as enum ('pending', 'accepted', 'declined', 'revoked');

create table if not exists public.platform_config (
  id uuid primary key default gen_random_uuid(),
  admin_allowlist_emails text[] not null default array['craftedbyholmes@gmail.com']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_config (admin_allowlist_emails)
select array['craftedbyholmes@gmail.com']::text[]
where not exists (select 1 from public.platform_config);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  strategy_mode public.strategy_mode not null default 'hybrid',
  receive_notifications boolean not null default true,
  receive_daily_top_bets boolean not null default false,
  receive_promotional_offers boolean not null default false,
  hide_qualifying_bets boolean not null default false,
  bankroll numeric(12,2) not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text not null,
  event_name text not null,
  sport text,
  market_label text,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  strategy_mode public.strategy_mode,
  min_profit_percent numeric(8,2),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_direct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists public.chat_invites (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  invited_by_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.chat_invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists chat_invites_pending_unique
  on public.chat_invites (chat_id, invited_user_id)
  where status = 'pending';

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    new.email,
    lower(split_part(coalesce(new.email, gen_random_uuid()::text), '@', 1)) || '-' || left(new.id::text, 6),
    split_part(coalesce(new.email, 'User'), '@', 1)
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.user_settings;
create trigger settings_touch_updated_at
before update on public.user_settings
for each row execute procedure public.touch_updated_at();

drop trigger if exists alerts_touch_updated_at on public.alert_rules;
create trigger alerts_touch_updated_at
before update on public.alert_rules
for each row execute procedure public.touch_updated_at();

drop trigger if exists chats_touch_updated_at on public.chats;
create trigger chats_touch_updated_at
before update on public.chats
for each row execute procedure public.touch_updated_at();

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '');
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_config pc
    where lower(public.current_user_email()) = any (
      select lower(x) from unnest(pc.admin_allowlist_emails) as x
    )
  );
$$;

create or replace function public.can_access_chat(target_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = target_chat_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.create_chat_with_owner(
  chat_title text,
  chat_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_chat_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.chats (owner_user_id, title, description)
  values (auth.uid(), chat_title, chat_description)
  returning id into new_chat_id;

  insert into public.chat_members (chat_id, user_id, role)
  values (new_chat_id, auth.uid(), 'owner')
  on conflict do nothing;

  return new_chat_id;
end;
$$;

create or replace function public.invite_user_to_chat(
  target_chat_id uuid,
  target_username text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
  invite_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.chat_members
    where chat_id = target_chat_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) then
    raise exception 'Only chat owner/admin can invite users';
  end if;

  select p.id into target_user_id
  from public.profiles p
  where lower(p.username) = lower(target_username)
  limit 1;

  if target_user_id is null then
    raise exception 'Username not found';
  end if;

  insert into public.chat_invites (
    chat_id,
    invited_by_user_id,
    invited_user_id,
    status
  )
  values (
    target_chat_id,
    auth.uid(),
    target_user_id,
    'pending'
  )
  on conflict do nothing
  returning id into invite_id;

  return invite_id;
end;
$$;

create or replace function public.respond_to_chat_invite(
  target_invite_id uuid,
  accept_invite boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_chat_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.chat_invites
  set status = case when accept_invite then 'accepted' else 'declined' end,
      responded_at = now()
  where id = target_invite_id
    and invited_user_id = auth.uid()
    and status = 'pending'
  returning chat_id into target_chat_id;

  if accept_invite and target_chat_id is not null then
    insert into public.chat_members (chat_id, user_id, role)
    values (target_chat_id, auth.uid(), 'member')
    on conflict do nothing;
  end if;
end;
$$;

alter table public.platform_config enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.alert_rules enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_invites enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists platform_config_admin_read on public.platform_config;
create policy platform_config_admin_read on public.platform_config
for select using (public.is_platform_admin());

drop policy if exists platform_config_admin_update on public.platform_config;
create policy platform_config_admin_update on public.platform_config
for update using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select using (auth.uid() = id or public.is_platform_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update using (auth.uid() = id or public.is_platform_admin())
with check (auth.uid() = id or public.is_platform_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists settings_self_manage on public.user_settings;
create policy settings_self_manage on public.user_settings
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists saved_self_manage on public.saved_opportunities;
create policy saved_self_manage on public.saved_opportunities
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists alerts_self_manage on public.alert_rules;
create policy alerts_self_manage on public.alert_rules
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists chats_members_read on public.chats;
create policy chats_members_read on public.chats
for select using (public.can_access_chat(id) or public.is_platform_admin());

drop policy if exists chats_owner_insert on public.chats;
create policy chats_owner_insert on public.chats
for insert with check (auth.uid() = owner_user_id or public.is_platform_admin());

drop policy if exists chats_owner_update on public.chats;
create policy chats_owner_update on public.chats
for update using (
  owner_user_id = auth.uid() or public.is_platform_admin()
)
with check (
  owner_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists members_chat_read on public.chat_members;
create policy members_chat_read on public.chat_members
for select using (public.can_access_chat(chat_id) or public.is_platform_admin());

drop policy if exists members_owner_insert on public.chat_members;
create policy members_owner_insert on public.chat_members
for insert with check (public.is_platform_admin());

drop policy if exists invites_visible_to_parties on public.chat_invites;
create policy invites_visible_to_parties on public.chat_invites
for select using (
  invited_user_id = auth.uid()
  or invited_by_user_id = auth.uid()
  or public.can_access_chat(chat_id)
  or public.is_platform_admin()
);

drop policy if exists invites_owner_insert on public.chat_invites;
create policy invites_owner_insert on public.chat_invites
for insert with check (
  invited_by_user_id = auth.uid() or public.is_platform_admin()
);

drop policy if exists invites_respond_update on public.chat_invites;
create policy invites_respond_update on public.chat_invites
for update using (
  invited_user_id = auth.uid()
  or invited_by_user_id = auth.uid()
  or public.is_platform_admin()
)
with check (
  invited_user_id = auth.uid()
  or invited_by_user_id = auth.uid()
  or public.is_platform_admin()
);

drop policy if exists messages_members_read on public.chat_messages;
create policy messages_members_read on public.chat_messages
for select using (public.can_access_chat(chat_id) or public.is_platform_admin());

drop policy if exists messages_members_insert on public.chat_messages;
create policy messages_members_insert on public.chat_messages
for insert with check (
  auth.uid() = user_id
  and (public.can_access_chat(chat_id) or public.is_platform_admin())
);

drop view if exists public.chat_overview;
create view public.chat_overview as
select
  c.id,
  c.title,
  c.description,
  c.owner_user_id,
  c.created_at,
  c.updated_at,
  (
    select count(*)::int
    from public.chat_members cm
    where cm.chat_id = c.id
  ) as member_count,
  (
    select cm2.body
    from public.chat_messages cm2
    where cm2.chat_id = c.id
    order by cm2.created_at desc
    limit 1
  ) as latest_message
from public.chats c;