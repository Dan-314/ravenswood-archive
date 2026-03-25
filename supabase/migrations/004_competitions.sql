-- Competitions: user-created script tournaments
create table competitions (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  created_by          uuid not null references auth.users(id) on delete cascade,
  status              text not null default 'open' check (status in ('open', 'closed', 'brackets', 'complete', 'cancelled')),
  submission_deadline timestamptz not null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index competitions_status on competitions (status);
create index competitions_created_by on competitions (created_by);
create index competitions_deadline on competitions (submission_deadline);

create trigger competitions_updated_at
  before update on competitions
  for each row execute function update_updated_at();

-- Competition entries: scripts submitted to a competition
create table competition_entries (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions(id) on delete cascade,
  script_id       uuid not null references scripts(id) on delete cascade,
  submitted_by    uuid not null references auth.users(id) on delete cascade,
  seed            int,
  created_at      timestamptz default now(),
  unique (competition_id, script_id)
);

create index competition_entries_comp on competition_entries (competition_id);
create index competition_entries_script on competition_entries (script_id);

-- RLS
alter table competitions enable row level security;
alter table competition_entries enable row level security;

-- Competitions: publicly readable
create policy "competitions are publicly readable"
  on competitions for select using (true);

-- Authenticated users can create competitions
create policy "authenticated users can create competitions"
  on competitions for insert
  with check (auth.uid() = created_by);

-- Creators can update own competitions
create policy "creators can update own competitions"
  on competitions for update
  using (auth.uid() = created_by);

-- Admins can manage all competitions
create policy "admins manage competitions"
  on competitions for all
  using ((auth.jwt() ->> 'role') = 'admin');

-- Entries: publicly readable
create policy "entries are publicly readable"
  on competition_entries for select using (true);

-- Authenticated users can submit entries (only when competition is open and deadline not passed)
create policy "authenticated users can submit entries"
  on competition_entries for insert
  with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from competitions
      where id = competition_id
      and status = 'open'
      and submission_deadline > now()
    )
  );

-- Users can delete their own entries
create policy "users can delete own entries"
  on competition_entries for delete
  using (auth.uid() = submitted_by);

-- Admins can manage all entries
create policy "admins manage entries"
  on competition_entries for all
  using ((auth.jwt() ->> 'role') = 'admin');
