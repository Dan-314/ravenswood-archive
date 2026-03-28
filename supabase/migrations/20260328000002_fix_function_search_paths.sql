-- Fix mutable search_path on all functions by pinning to 'public'

create or replace function update_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function generate_bracket(
  p_competition_id uuid,
  p_seed_order uuid[]
) returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_count int;
  v_bracket_size int;
  v_rounds int;
  v_matchup_count int;
  v_entry_a uuid;
  v_entry_b uuid;
  v_seed_a int;
  v_seed_b int;
  v_positions int[];
  v_new_positions int[];
  v_pos int;
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

  -- Delete any existing matchups for this competition
  delete from bracket_matchups where competition_id = p_competition_id;

  -- Update seeds on entries
  for i in 1..v_count loop
    update competition_entries
    set seed = i
    where id = p_seed_order[i] and competition_id = p_competition_id;
  end loop;

  -- Build standard bracket seed placement using recursive halving.
  v_positions := array[1];
  declare
    v_round_size int := 1;
  begin
    while v_round_size < v_bracket_size / 2 loop
      v_round_size := v_round_size * 2;
      v_new_positions := '{}';
      for i in 1..array_length(v_positions, 1) loop
        v_new_positions := v_new_positions || v_positions[i];
        v_new_positions := v_new_positions || (v_round_size + 1 - v_positions[i]);
      end loop;
      v_positions := v_new_positions;
    end loop;
  end;

  v_matchup_count := v_bracket_size / 2;
  for v_pos in 0..(v_matchup_count - 1) loop
    v_seed_a := v_positions[v_pos + 1];
    v_seed_b := v_bracket_size + 1 - v_seed_a;

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

      if (v_matchup.entry_a_id is null) != (v_matchup.entry_b_id is null) then
        v_winner := coalesce(v_matchup.entry_a_id, v_matchup.entry_b_id);

        update bracket_matchups
        set winner_entry_id = v_winner
        where id = v_matchup.id;

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

create or replace function advance_winner(
  p_matchup_id uuid,
  p_winner_entry_id uuid
) returns void language plpgsql security definer
set search_path = public
as $$
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
