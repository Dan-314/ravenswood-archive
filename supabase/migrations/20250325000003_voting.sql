-- Votes on bracket matchups (one vote per user per matchup)
create table matchup_votes (
  id          uuid primary key default gen_random_uuid(),
  matchup_id  uuid not null references bracket_matchups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_id    uuid not null references competition_entries(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (matchup_id, user_id)
);

create index matchup_votes_matchup on matchup_votes (matchup_id);

-- RLS
alter table matchup_votes enable row level security;

create policy "votes are publicly readable"
  on matchup_votes for select using (true);

create policy "authenticated users can vote on open matchups"
  on matchup_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from bracket_matchups
      where id = matchup_id
      and voting_open = true
      and winner_entry_id is null
    )
  );

create policy "admins manage votes"
  on matchup_votes for all
  using ((auth.jwt() ->> 'role') = 'admin');
