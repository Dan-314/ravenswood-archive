-- Fix auth.uid() / auth.jwt() being re-evaluated per row in RLS policies.
-- Wrapping in (select ...) causes Postgres to evaluate them once per query.

-- ============================================================
-- scripts
-- ============================================================
drop policy if exists "users can read own pending scripts" on scripts;
drop policy if exists "users can read own scripts" on scripts;
drop policy if exists "users can update own scripts" on scripts;
drop policy if exists "users can delete own scripts" on scripts;
drop policy if exists "admins can do everything" on scripts;
drop policy if exists "admins can update scripts" on scripts;
drop policy if exists "admins can delete scripts" on scripts;
drop policy if exists "authenticated users can submit scripts" on scripts;

create policy "users can read own scripts"
  on scripts for select
  using ((select auth.uid()) = submitted_by);

create policy "users can update own scripts"
  on scripts for update
  using ((select auth.uid()) = submitted_by)
  with check ((select auth.uid()) = submitted_by);

create policy "users can delete own scripts"
  on scripts for delete
  using ((select auth.uid()) = submitted_by);

create policy "admins can do everything"
  on scripts for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "admins can update scripts"
  on scripts for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "admins can delete scripts"
  on scripts for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "authenticated users can submit scripts"
  on scripts for insert
  with check ((select auth.uid()) = submitted_by);

-- ============================================================
-- script_versions
-- ============================================================
drop policy if exists "owners can read versions of own scripts" on script_versions;
drop policy if exists "owners can insert versions of own scripts" on script_versions;
drop policy if exists "admins can manage script_versions" on script_versions;

create policy "owners can read versions of own scripts"
  on script_versions for select
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
  );

create policy "owners can insert versions of own scripts"
  on script_versions for insert
  with check (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
    and edited_by = (select auth.uid())
  );

create policy "admins can manage script_versions"
  on script_versions for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- groups
-- ============================================================
drop policy if exists "admins manage groups" on groups;

create policy "admins manage groups"
  on groups for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- script_groups
-- ============================================================
drop policy if exists "admins manage script_groups" on script_groups;

create policy "admins manage script_groups"
  on script_groups for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- competitions
-- ============================================================
drop policy if exists "authenticated users can create competitions" on competitions;
drop policy if exists "creators can update own competitions" on competitions;
drop policy if exists "admins manage competitions" on competitions;

create policy "authenticated users can create competitions"
  on competitions for insert
  with check ((select auth.uid()) = created_by);

create policy "creators can update own competitions"
  on competitions for update
  using ((select auth.uid()) = created_by);

create policy "admins manage competitions"
  on competitions for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- competition_entries
-- ============================================================
drop policy if exists "authenticated users can submit entries" on competition_entries;
drop policy if exists "users can delete own entries" on competition_entries;
drop policy if exists "admins manage entries" on competition_entries;

create policy "authenticated users can submit entries"
  on competition_entries for insert
  with check (
    (select auth.uid()) = submitted_by
    and exists (
      select 1 from competitions
      where id = competition_id
      and status = 'open'
      and submission_deadline > now()
    )
  );

create policy "users can delete own entries"
  on competition_entries for delete
  using ((select auth.uid()) = submitted_by);

create policy "admins manage entries"
  on competition_entries for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- bracket_matchups
-- ============================================================
drop policy if exists "creator can insert matchups" on bracket_matchups;
drop policy if exists "creator can update matchups" on bracket_matchups;
drop policy if exists "creator can delete matchups" on bracket_matchups;
drop policy if exists "admins manage matchups" on bracket_matchups;

create policy "creator can insert matchups"
  on bracket_matchups for insert
  with check (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
  );

create policy "creator can update matchups"
  on bracket_matchups for update
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
  );

create policy "creator can delete matchups"
  on bracket_matchups for delete
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
  );

create policy "admins manage matchups"
  on bracket_matchups for all
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- matchup_votes
-- ============================================================
drop policy if exists "authenticated users can vote on open matchups" on matchup_votes;
drop policy if exists "admins manage votes" on matchup_votes;

create policy "authenticated users can vote on open matchups"
  on matchup_votes for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from bracket_matchups
      where id = matchup_id
      and voting_open = true
      and winner_entry_id is null
    )
  );

create policy "admins manage votes"
  on matchup_votes for all
  using (((select auth.jwt()) ->> 'role') = 'admin');
