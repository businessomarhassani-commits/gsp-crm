-- SuccessPro CRM — Initial Schema
-- Run this in your Supabase SQL Editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type prospect_status as enum (
  'new', 'contacted', 'interested', 'proposal_sent',
  'client', 'not_interested', 'follow_up_later'
);
create type outreach_type as enum (
  'cold_call', 'cold_email', 'instagram_dm', 'linkedin_message', 'door_to_door'
);
create type team_role as enum ('owner', 'admin', 'sales_rep', 'copywriter', 'viewer');
create type payment_status as enum ('paid', 'pending', 'overdue');
create type creative_status as enum ('draft', 'active', 'paused');
create type budget_currency as enum ('MAD', 'USD', 'EUR');

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        team_role default 'owner',
  created_at  timestamptz default now()
);

-- Trigger to auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Niches ──────────────────────────────────────────────────────────────────
create table if not exists niches (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  name             text not null,
  description      text,
  target_country   text,
  target_city      text,
  budget_min       numeric(12,2) default 0,
  budget_max       numeric(12,2) default 0,
  budget_currency  budget_currency default 'MAD',
  color            text default '#3b82f6',
  created_at       timestamptz default now()
);

-- ─── Prospects ───────────────────────────────────────────────────────────────
create table if not exists prospects (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  niche_id          uuid references niches(id) on delete set null,
  full_name         text not null,
  business_name     text,
  phone             text,
  whatsapp          text,
  email             text,
  instagram_handle  text,
  linkedin_url      text,
  website           text,
  city              text,
  country           text default 'Morocco',
  source            text,
  notes             text,
  tags              text[] default '{}',
  status            prospect_status default 'new',
  follow_up_date    date,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger prospects_updated_at before update on prospects
  for each row execute procedure update_updated_at();

-- ─── Outreach Logs ───────────────────────────────────────────────────────────
create table if not exists outreach_logs (
  id               uuid primary key default uuid_generate_v4(),
  prospect_id      uuid not null references prospects(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  type             outreach_type not null,
  date             date not null default current_date,
  duration_minutes integer,
  subject          text,
  outcome          text,
  response_status  text,
  notes            text,
  created_at       timestamptz default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  prospect_id   uuid references prospects(id) on delete cascade,
  outreach_type outreach_type,
  due_date      date not null,
  completed     boolean default false,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz default now()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────
create table if not exists clients (
  id               uuid primary key default uuid_generate_v4(),
  prospect_id      uuid not null references prospects(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  monthly_fee      numeric(12,2) not null default 0,
  fee_currency     budget_currency default 'MAD',
  service_type     text,
  contract_start   date,
  contract_months  integer default 12,
  created_at       timestamptz default now()
);

-- ─── Payments ────────────────────────────────────────────────────────────────
create table if not exists payments (
  id         uuid primary key default uuid_generate_v4(),
  client_id  uuid not null references clients(id) on delete cascade,
  amount     numeric(12,2) not null,
  currency   budget_currency default 'MAD',
  month      integer not null check (month between 1 and 12),
  year       integer not null,
  status     payment_status default 'pending',
  paid_at    timestamptz,
  notes      text,
  created_at timestamptz default now()
);

-- ─── Team Members ────────────────────────────────────────────────────────────
create table if not exists team_members (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  member_id   uuid references profiles(id) on delete set null,
  email       text not null,
  role        team_role not null default 'viewer',
  invited_at  timestamptz default now(),
  accepted_at timestamptz
);

-- ─── Scraper Results ─────────────────────────────────────────────────────────
create table if not exists scraper_results (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  source     text not null,
  keyword    text not null,
  city       text not null,
  niche_id   uuid references niches(id) on delete set null,
  results    jsonb default '[]',
  created_at timestamptz default now()
);

-- ─── Currency Settings ────────────────────────────────────────────────────────
create table if not exists currency_settings (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null unique references profiles(id) on delete cascade,
  usd_to_mad         numeric(10,4) default 10.0000,
  eur_to_mad         numeric(10,4) default 10.9000,
  preferred_currency budget_currency default 'MAD',
  updated_at         timestamptz default now()
);

-- ─── Copy Library ─────────────────────────────────────────────────────────────
create table if not exists copy_library (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  niche_id        uuid references niches(id) on delete set null,
  outreach_type   text not null,
  target_business text,
  pain_point      text,
  offer           text,
  tone            text,
  language        text default 'English',
  content         text not null,
  created_at      timestamptz default now()
);

-- ─── Creatives ────────────────────────────────────────────────────────────────
create table if not exists creatives (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  niche_id          uuid references niches(id) on delete set null,
  ad_concept        text,
  target_audience   text,
  hook              text,
  visual_style      text,
  duration          text,
  script            text,
  scene_breakdown   text,
  voiceover         text,
  onscreen_text     text,
  cta               text,
  video_url         text,
  status            creative_status default 'draft',
  performance_notes text,
  created_at        timestamptz default now()
);

-- ─── Campaigns ────────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  niche_id    uuid references niches(id) on delete set null,
  name        text not null,
  description text,
  start_date  date,
  end_date    date,
  status      text default 'active',
  created_at  timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table niches enable row level security;
alter table prospects enable row level security;
alter table outreach_logs enable row level security;
alter table tasks enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table team_members enable row level security;
alter table scraper_results enable row level security;
alter table currency_settings enable row level security;
alter table copy_library enable row level security;
alter table creatives enable row level security;
alter table campaigns enable row level security;

-- Profiles: own row only
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Niches: own data
create policy "niches_all" on niches for all using (auth.uid() = user_id);

-- Prospects: own data
create policy "prospects_all" on prospects for all using (auth.uid() = user_id);

-- Outreach: own data
create policy "outreach_all" on outreach_logs for all using (auth.uid() = user_id);

-- Tasks: own data
create policy "tasks_all" on tasks for all using (auth.uid() = user_id);

-- Clients: own data
create policy "clients_all" on clients for all using (auth.uid() = user_id);

-- Payments: own data via clients
create policy "payments_all" on payments for all using (
  exists (select 1 from clients where clients.id = payments.client_id and clients.user_id = auth.uid())
);

-- Team members: owner or member
create policy "team_select" on team_members for select
  using (auth.uid() = owner_id or auth.uid() = member_id);
create policy "team_insert" on team_members for insert with check (auth.uid() = owner_id);
create policy "team_update" on team_members for update using (auth.uid() = owner_id);
create policy "team_delete" on team_members for delete using (auth.uid() = owner_id);

-- Scraper results: own data
create policy "scraper_all" on scraper_results for all using (auth.uid() = user_id);

-- Currency settings: own data
create policy "currency_all" on currency_settings for all using (auth.uid() = user_id);

-- Copy library: own data
create policy "copy_all" on copy_library for all using (auth.uid() = user_id);

-- Creatives: own data
create policy "creatives_all" on creatives for all using (auth.uid() = user_id);

-- Campaigns: own data
create policy "campaigns_all" on campaigns for all using (auth.uid() = user_id);

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
-- Run in Supabase dashboard: Realtime > Tables > enable for: tasks, prospects, outreach_logs
