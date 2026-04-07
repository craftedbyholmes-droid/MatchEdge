create type public.privacy_request_type as enum ('access', 'erasure', 'restriction', 'rectification');
create type public.privacy_request_status as enum ('open', 'in_progress', 'completed', 'rejected');

create table if not exists public.terms_acceptance_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create table if not exists public.cookie_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  essential boolean not null default true,
  analytics boolean not null default false,
  marketing boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  granted boolean not null,
  policy_version text not null default 'v1',
  granted_at timestamptz not null default now()
);

create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type public.privacy_request_type not null,
  status public.privacy_request_status not null default 'open',
  request_details text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.breach_log (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text not null default 'low',
  reportable boolean not null default false,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_register (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  purpose text not null,
  data_categories text[] not null default array[]::text[],
  lawful_basis text,
  location text,
  retention_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.vendor_register (vendor_name, purpose, data_categories, lawful_basis, location, retention_notes)
values
  ('Supabase', 'Authentication, database hosting, storage', array['account data','settings','chat data'], 'contract', 'EU/EEA or configured region', 'Retain while account is active and for required legal/operational period'),
  ('The Odds API', 'Sports odds data provider', array['limited technical request metadata'], 'legitimate interests', 'Third-party provider', 'No user account data intentionally sent'),
  ('Odds-API.io', 'Sports odds data provider', array['limited technical request metadata'], 'legitimate interests', 'Third-party provider', 'No user account data intentionally sent')
on conflict (vendor_name) do nothing;

alter table public.terms_acceptance_log enable row level security;
alter table public.cookie_preferences enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.data_subject_requests enable row level security;
alter table public.audit_log enable row level security;
alter table public.breach_log enable row level security;
alter table public.vendor_register enable row level security;

create policy if not exists terms_acceptance_self_read on public.terms_acceptance_log
for select using (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists terms_acceptance_self_insert on public.terms_acceptance_log
for insert with check (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists cookie_prefs_self_manage on public.cookie_preferences
for all using (auth.uid() = user_id or public.is_platform_admin())
with check (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists privacy_consents_self_read on public.privacy_consents
for select using (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists privacy_consents_self_insert on public.privacy_consents
for insert with check (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists dsr_self_manage on public.data_subject_requests
for select using (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists dsr_self_insert on public.data_subject_requests
for insert with check (auth.uid() = user_id or public.is_platform_admin());
create policy if not exists dsr_admin_update on public.data_subject_requests
for update using (public.is_platform_admin())
with check (public.is_platform_admin());
create policy if not exists audit_admin_read on public.audit_log
for select using (public.is_platform_admin());
create policy if not exists audit_insert_self_or_admin on public.audit_log
for insert with check (auth.uid() = actor_user_id or public.is_platform_admin() or actor_user_id is null);
create policy if not exists breach_admin_manage on public.breach_log
for all using (public.is_platform_admin())
with check (public.is_platform_admin());
create policy if not exists vendor_admin_read on public.vendor_register
for select using (public.is_platform_admin());
create policy if not exists vendor_admin_manage on public.vendor_register
for all using (public.is_platform_admin())
with check (public.is_platform_admin());