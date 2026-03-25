-- Fix bracket seeding so top seeds are on opposite sides of the bracket.
-- Uses standard tournament seeding: recursive halving to place seeds such that
-- seed 1 and 2 can only meet in the final, 1-4 only in semis, etc.
create or replace function generate_bracket(
  p_competition_id uuid,
  p_seed_order uuid[]
) returns void language plpgsql security definer as $$
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
  -- Start with [1, 2], then for each doubling interleave with complements.
  -- Result for 8: positions array where index = matchup position, value = seed for slot A.
  -- Slot B is always (bracket_size + 1 - slot_a_seed).
  --
  -- For bracket_size 4: [1, 4, 2, 3] → matchup 0: 1v4, matchup 1: 2v3
  --   Wait, we need pairs: pos 0 = seed 1 vs seed 4, pos 1 = seed 3 vs seed 2
  --
  -- Standard method: start with [1], then for each round:
  --   for each seed s in current list, add (current_round_size + 1 - s)
  --   interleave: [s1, complement1, s2, complement2, ...]
  -- This gives the "top half" seeds. Pair each with (bracket_size + 1 - seed).
  --
  -- For 8: [1] → [1,2] → [1,4,2,3] → these are the "top seeds" per matchup
  -- Matchup 0: seed 1 vs seed 8, Matchup 1: seed 4 vs seed 5,
  -- Matchup 2: seed 2 vs seed 7, Matchup 3: seed 3 vs seed 6
  -- Seeds 1,4 on top half; seeds 2,3 on bottom half. 1 and 2 meet only in final.

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

  -- v_positions now has the seed-A for each matchup position
  -- seed-B = bracket_size + 1 - seed-A
  v_matchup_count := v_bracket_size / 2;
  for v_pos in 0..(v_matchup_count - 1) loop
    v_seed_a := v_positions[v_pos + 1]; -- 1-indexed array
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
