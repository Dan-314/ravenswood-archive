-- Enable pg_trgm for fuzzy name/author search
create extension if not exists pg_trgm;

-- Characters lookup table (seed with all BotC characters)
create table characters (
  id   text primary key,   -- e.g. "washerwoman"
  name text not null,       -- e.g. "Washerwoman"
  team text not null        -- 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled'
);

-- Groups (e.g. "World Cup 2024", "Finalist", "Community Favourite")
create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

-- Core scripts table
create table scripts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  author         text,
  script_type    text not null check (script_type in ('full', 'teensy')),
  has_carousel   boolean not null default false,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by   uuid references auth.users(id) on delete set null,
  character_ids  text[] not null default '{}',
  raw_json       jsonb not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Many-to-many: scripts <-> groups
create table script_groups (
  script_id uuid not null references scripts(id) on delete cascade,
  group_id  uuid not null references groups(id) on delete cascade,
  primary key (script_id, group_id)
);

-- Indexes for fast filtering
create index scripts_name_trgm   on scripts using gin (name gin_trgm_ops);
create index scripts_author_trgm on scripts using gin (author gin_trgm_ops);
create index scripts_character_ids on scripts using gin (character_ids);
create index scripts_type        on scripts (script_type);
create index scripts_carousel    on scripts (has_carousel);
create index scripts_status      on scripts (status);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scripts_updated_at
  before update on scripts
  for each row execute function update_updated_at();

-- Row-level security
alter table scripts enable row level security;
alter table groups enable row level security;
alter table script_groups enable row level security;
alter table characters enable row level security;

-- Public can read approved scripts
create policy "approved scripts are public"
  on scripts for select
  using (status = 'approved');

-- Authenticated users can read their own pending scripts
create policy "users can read own pending scripts"
  on scripts for select
  using (auth.uid() = submitted_by);

-- Authenticated users can insert scripts
create policy "authenticated users can submit scripts"
  on scripts for insert
  with check (auth.uid() = submitted_by);

-- Admins can do everything (role stored in user metadata)
create policy "admins can do everything"
  on scripts for all
  using ((auth.jwt() ->> 'role') = 'admin');

-- Groups and characters are public read
create policy "groups are public"
  on groups for select using (true);

create policy "admins manage groups"
  on groups for all
  using ((auth.jwt() ->> 'role') = 'admin');

create policy "characters are public"
  on characters for select using (true);

create policy "script_groups are public"
  on script_groups for select using (true);

create policy "admins manage script_groups"
  on script_groups for all
  using ((auth.jwt() ->> 'role') = 'admin');
