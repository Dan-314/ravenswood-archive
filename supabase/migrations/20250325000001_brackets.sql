-- Bracket matchups for single-elimination tournaments
create table bracket_matchups (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions(id) on delete cascade,
  round           int not null,
  position        int not null,
  entry_a_id      uuid references competition_entries(id) on delete set null,
  entry_b_id      uuid references competition_entries(id) on delete set null,
  winner_entry_id uuid references competition_entries(id) on delete set null,
  voting_open     boolean not null default false,
  created_at      timestamptz default now(),
  unique (competition_id, round, position)
);

create index bracket_matchups_comp on bracket_matchups (competition_id);
create index bracket_matchups_round on bracket_matchups (competition_id, round);

-- RLS
alter table bracket_matchups enable row level security;

create policy "matchups are publicly readable"
  on bracket_matchups for select using (true);

create policy "creator can insert matchups"
  on bracket_matchups for insert
  with check (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = auth.uid()
    )
  );

create policy "creator can update matchups"
  on bracket_matchups for update
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = auth.uid()
    )
  );

create policy "creator can delete matchups"
  on bracket_matchups for delete
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = auth.uid()
    )
  );

create policy "admins manage matchups"
  on bracket_matchups for all
  using ((auth.jwt() ->> 'role') = 'admin');

-- Generate a single-elimination bracket from seeded entries.
-- p_seed_order is an array of competition_entry IDs in seed order (1st = top seed).
-- Uses standard bracket seeding: seed 1 vs last, seed 2 vs second-last, etc.
-- Top seeds get byes when entry count is not a power of 2.
create or replace function generate_bracket(
  p_competition_id uuid,
  p_seed_order uuid[]
) returns void language plpgsql security definer as $$
declare
  v_count int;
  v_bracket_size int;
  v_rounds int;
  v_num_byes int;
  v_matchup_count int;
  v_entry_a uuid;
  v_entry_b uuid;
  v_seed_a int;
  v_seed_b int;
begin
  -- Verify caller is competition creator and status is closed
  if not exists (
    select 1 from competitions
    where id = p_competition_id and created_by = auth.uid() and status = 'closed'
  ) then
    raise exception 'Not authorized or competition not in closed state';
  end if;

  v_count := array_length(p_seed_order, 1);
  if v_count is null or v_count < 2 then
    raise exception 'Need at least 2 entries to generate a bracket';
  end if;

  -- Find next power of 2
  v_bracket_size := 1;
  while v_bracket_size < v_count loop
    v_bracket_size := v_bracket_size * 2;
  end loop;

  v_rounds := (ln(v_bracket_size) / ln(2))::int;
  v_num_byes := v_bracket_size - v_count;

  -- Delete any existing matchups for this competition
  delete from bracket_matchups where competition_id = p_competition_id;

  -- Update seeds on entries
  for i in 1..v_count loop
    update competition_entries
    set seed = i
    where id = p_seed_order[i] and competition_id = p_competition_id;
  end loop;

  -- Insert round 1 matchups
  -- Standard seeding: position 0 = seed 1 vs seed bracket_size,
  --                   position 1 = seed bracket_size/2+1 vs seed bracket_size/2, etc.
  -- Simplified: pair seed i with seed (bracket_size + 1 - i) for positions 0..bracket_size/2-1
  v_matchup_count := v_bracket_size / 2;
  for v_pos in 0..(v_matchup_count - 1) loop
    v_seed_a := v_pos + 1;
    v_seed_b := v_bracket_size - v_pos;

    v_entry_a := null;
    v_entry_b := null;

    if v_seed_a <= v_count then
      v_entry_a := p_seed_order[v_seed_a];
    end if;
    if v_seed_b <= v_count then
      v_entry_b := p_seed_order[v_seed_b];
    end if;

    insert into bracket_matchups (competition_id, round, position, entry_a_id, entry_b_id)
    values (p_competition_id, 1, v_pos, v_entry_a, v_entry_b);
  end loop;

  -- Insert empty matchups for rounds 2..v_rounds
  for v_round in 2..v_rounds loop
    v_matchup_count := v_bracket_size / (power(2, v_round))::int;
    for v_pos in 0..(v_matchup_count - 1) loop
      insert into bracket_matchups (competition_id, round, position, entry_a_id, entry_b_id)
      values (p_competition_id, v_round, v_pos, null, null);
    end loop;
  end loop;

  -- Auto-advance byes in round 1 and propagate to round 2
  for v_pos in 0..(v_bracket_size / 2 - 1) loop
    declare
      v_matchup bracket_matchups%rowtype;
      v_winner uuid;
      v_next_pos int;
      v_is_slot_a boolean;
    begin
      select * into v_matchup
      from bracket_matchups
      where competition_id = p_competition_id and round = 1 and position = v_pos;

      -- If exactly one entry is null, auto-advance the other
      if (v_matchup.entry_a_id is null) != (v_matchup.entry_b_id is null) then
        v_winner := coalesce(v_matchup.entry_a_id, v_matchup.entry_b_id);

        update bracket_matchups
        set winner_entry_id = v_winner
        where id = v_matchup.id;

        -- Place winner in round 2
        v_next_pos := v_pos / 2;
        v_is_slot_a := (v_pos % 2 = 0);

        if v_is_slot_a then
          update bracket_matchups
          set entry_a_id = v_winner
          where competition_id = p_competition_id and round = 2 and position = v_next_pos;
        else
          update bracket_matchups
          set entry_b_id = v_winner
          where competition_id = p_competition_id and round = 2 and position = v_next_pos;
        end if;
      end if;
    end;
  end loop;

  -- Update competition status
  update competitions set status = 'brackets' where id = p_competition_id;
end;
$$;

-- Advance a winner from a matchup to the next round.
-- Sets the winner, closes voting, places the winner in the next round slot.
-- If this was the final matchup, marks the competition as complete.
create or replace function advance_winner(
  p_matchup_id uuid,
  p_winner_entry_id uuid
) returns void language plpgsql security definer as $$
declare
  v_matchup bracket_matchups%rowtype;
  v_next_pos int;
  v_is_slot_a boolean;
  v_total_rounds int;
begin
  select * into v_matchup from bracket_matchups where id = p_matchup_id;

  if not found then
    raise exception 'Matchup not found';
  end if;

  -- Verify caller is competition creator
  if not exists (
    select 1 from competitions
    where id = v_matchup.competition_id and created_by = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  -- Verify winner is one of the two entries
  if p_winner_entry_id != v_matchup.entry_a_id and p_winner_entry_id != v_matchup.entry_b_id then
    raise exception 'Winner must be one of the matchup entries';
  end if;

  -- Set winner and close voting
  update bracket_matchups
  set winner_entry_id = p_winner_entry_id, voting_open = false
  where id = p_matchup_id;

  -- Find total rounds
  select max(round) into v_total_rounds
  from bracket_matchups where competition_id = v_matchup.competition_id;

  -- If this is the final round, mark competition complete
  if v_matchup.round = v_total_rounds then
    update competitions set status = 'complete' where id = v_matchup.competition_id;
    return;
  end if;

  -- Place winner in next round
  v_next_pos := v_matchup.position / 2;
  v_is_slot_a := (v_matchup.position % 2 = 0);

  if v_is_slot_a then
    update bracket_matchups
    set entry_a_id = p_winner_entry_id
    where competition_id = v_matchup.competition_id
      and round = v_matchup.round + 1
      and position = v_next_pos;
  else
    update bracket_matchups
    set entry_b_id = p_winner_entry_id
    where competition_id = v_matchup.competition_id
      and round = v_matchup.round + 1
      and position = v_next_pos;
  end if;
end;
$$;
