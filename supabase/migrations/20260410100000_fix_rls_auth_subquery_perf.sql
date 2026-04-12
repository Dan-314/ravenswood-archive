-- Fix auth.jwt() and auth.uid() being re-evaluated per row in RLS policies.
-- Wrapping in (select ...) makes Postgres evaluate once per query, not per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================
-- scripts
-- ============================================================
drop policy if exists "select scripts" on scripts;
drop policy if exists "insert scripts" on scripts;
drop policy if exists "update scripts" on scripts;
drop policy if exists "delete scripts" on scripts;

create policy "select scripts"
  on scripts for select
  using (
    status = 'approved'
    or (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "insert scripts"
  on scripts for insert
  with check (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update scripts"
  on scripts for update
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "delete scripts"
  on scripts for delete
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- script_versions
-- ============================================================
drop policy if exists "select script_versions" on script_versions;
drop policy if exists "insert script_versions" on script_versions;
drop policy if exists "update script_versions" on script_versions;
drop policy if exists "delete script_versions" on script_versions;
drop policy if exists "owners can update versions of own scripts" on script_versions;

create policy "select script_versions"
  on script_versions for select
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.status = 'approved'
    )
    or exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "insert script_versions"
  on script_versions for insert
  with check (
    (
      exists (
        select 1 from scripts s
        where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
      )
      and edited_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update script_versions"
  on script_versions for update
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "delete script_versions"
  on script_versions for delete
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- collections
-- ============================================================
drop policy if exists "insert collections" on collections;
drop policy if exists "update collections" on collections;
drop policy if exists "delete collections" on collections;

create policy "insert collections"
  on collections for insert
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "update collections"
  on collections for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "delete collections"
  on collections for delete
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- script_collections
-- ============================================================
drop policy if exists "insert script_collections" on script_collections;
drop policy if exists "update script_collections" on script_collections;
drop policy if exists "delete script_collections" on script_collections;

create policy "insert script_collections"
  on script_collections for insert
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "update script_collections"
  on script_collections for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "delete script_collections"
  on script_collections for delete
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- competitions
-- ============================================================
drop policy if exists "insert competitions" on competitions;
drop policy if exists "update competitions" on competitions;
drop policy if exists "delete competitions" on competitions;

create policy "insert competitions"
  on competitions for insert
  with check (
    (select auth.uid()) = created_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update competitions"
  on competitions for update
  using (
    (select auth.uid()) = created_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "delete competitions"
  on competitions for delete
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- competition_entries
-- ============================================================
drop policy if exists "insert competition_entries" on competition_entries;
drop policy if exists "update competition_entries" on competition_entries;
drop policy if exists "delete competition_entries" on competition_entries;

create policy "insert competition_entries"
  on competition_entries for insert
  with check (
    (
      (select auth.uid()) = submitted_by
      and exists (
        select 1 from competitions
        where id = competition_id
        and status = 'open'
        and submission_deadline > now()
      )
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update competition_entries"
  on competition_entries for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "delete competition_entries"
  on competition_entries for delete
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- bracket_matchups
-- ============================================================
drop policy if exists "insert bracket_matchups" on bracket_matchups;
drop policy if exists "update bracket_matchups" on bracket_matchups;
drop policy if exists "delete bracket_matchups" on bracket_matchups;

create policy "insert bracket_matchups"
  on bracket_matchups for insert
  with check (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update bracket_matchups"
  on bracket_matchups for update
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "delete bracket_matchups"
  on bracket_matchups for delete
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- matchup_votes
-- ============================================================
drop policy if exists "insert matchup_votes" on matchup_votes;
drop policy if exists "update matchup_votes" on matchup_votes;
drop policy if exists "delete matchup_votes" on matchup_votes;

create policy "insert matchup_votes"
  on matchup_votes for insert
  with check (
    (
      (select auth.uid()) = user_id
      and exists (
        select 1 from bracket_matchups
        where id = matchup_id
        and voting_open = true
        and winner_entry_id is null
      )
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "update matchup_votes"
  on matchup_votes for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "delete matchup_votes"
  on matchup_votes for delete
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- script_claims
-- ============================================================
drop policy if exists "select script_claims" on script_claims;
drop policy if exists "insert script_claims" on script_claims;
drop policy if exists "update script_claims" on script_claims;
drop policy if exists "delete script_claims" on script_claims;

create policy "select script_claims"
  on script_claims for select
  using (
    claimant_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "insert script_claims"
  on script_claims for insert
  with check (
    claimant_id = (select auth.uid())
  );

create policy "update script_claims"
  on script_claims for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "delete script_claims"
  on script_claims for delete
  using (
    (claimant_id = (select auth.uid()) and status = 'pending')
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- script_downloads
-- ============================================================
drop policy if exists "select script_downloads" on script_downloads;

create policy "select script_downloads"
  on script_downloads for select
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- user_preferences
-- ============================================================
drop policy if exists "users can read own preferences" on user_preferences;
drop policy if exists "users can insert own preferences" on user_preferences;
drop policy if exists "users can update own preferences" on user_preferences;
drop policy if exists "users can delete own preferences" on user_preferences;

create policy "users can read own preferences"
  on user_preferences for select
  using ((select auth.uid()) = user_id);

create policy "users can insert own preferences"
  on user_preferences for insert
  with check ((select auth.uid()) = user_id);

create policy "users can update own preferences"
  on user_preferences for update
  using ((select auth.uid()) = user_id);

create policy "users can delete own preferences"
  on user_preferences for delete
  using ((select auth.uid()) = user_id);
