-- Consolidate RLS policies to eliminate multiple permissive policies per (role, action).
-- FOR ALL admin policies overlap with specific-action user policies, causing every policy
-- to be evaluated for every row. Fix: drop FOR ALL admin policies, merge admin check into
-- each specific-action policy with OR.

-- ============================================================
-- scripts
-- SELECT is not public (only approved rows), so admin needs merging there too.
-- ============================================================
drop policy if exists "admins can do everything" on scripts;
drop policy if exists "admins can update scripts" on scripts;
drop policy if exists "admins can delete scripts" on scripts;
drop policy if exists "approved scripts are public" on scripts;
drop policy if exists "users can read own scripts" on scripts;
drop policy if exists "users can update own scripts" on scripts;
drop policy if exists "users can delete own scripts" on scripts;
drop policy if exists "authenticated users can submit scripts" on scripts;

create policy "select scripts"
  on scripts for select
  using (
    status = 'approved'
    or (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "insert scripts"
  on scripts for insert
  with check (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update scripts"
  on scripts for update
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  )
  with check (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "delete scripts"
  on scripts for delete
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

-- ============================================================
-- script_versions
-- SELECT is not public (only versions of approved scripts), so merge admin into SELECT too.
-- ============================================================
drop policy if exists "admins can manage script_versions" on script_versions;
drop policy if exists "versions of approved scripts are public" on script_versions;
drop policy if exists "owners can read versions of own scripts" on script_versions;
drop policy if exists "owners can insert versions of own scripts" on script_versions;

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
    or ((select auth.jwt()) ->> 'role') = 'admin'
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
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update script_versions"
  on script_versions for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "delete script_versions"
  on script_versions for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- groups
-- SELECT is public (true), so admin is already covered there.
-- Only need admin policies for INSERT/UPDATE/DELETE.
-- ============================================================
drop policy if exists "admins manage groups" on groups;

create policy "insert groups"
  on groups for insert
  with check (((select auth.jwt()) ->> 'role') = 'admin');

create policy "update groups"
  on groups for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "delete groups"
  on groups for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- script_groups
-- SELECT is public (true). Only need admin for INSERT/UPDATE/DELETE.
-- ============================================================
drop policy if exists "admins manage script_groups" on script_groups;

create policy "insert script_groups"
  on script_groups for insert
  with check (((select auth.jwt()) ->> 'role') = 'admin');

create policy "update script_groups"
  on script_groups for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "delete script_groups"
  on script_groups for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- competitions
-- SELECT is public (true). Merge admin into INSERT/UPDATE; admin-only DELETE.
-- ============================================================
drop policy if exists "admins manage competitions" on competitions;
drop policy if exists "authenticated users can create competitions" on competitions;
drop policy if exists "creators can update own competitions" on competitions;

create policy "insert competitions"
  on competitions for insert
  with check (
    (select auth.uid()) = created_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update competitions"
  on competitions for update
  using (
    (select auth.uid()) = created_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "delete competitions"
  on competitions for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- ============================================================
-- competition_entries
-- SELECT is public (true). Merge admin into INSERT/DELETE; admin-only UPDATE.
-- ============================================================
drop policy if exists "admins manage entries" on competition_entries;
drop policy if exists "authenticated users can submit entries" on competition_entries;
drop policy if exists "users can delete own entries" on competition_entries;

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
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update competition_entries"
  on competition_entries for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "delete competition_entries"
  on competition_entries for delete
  using (
    (select auth.uid()) = submitted_by
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

-- ============================================================
-- bracket_matchups
-- SELECT is public (true). Merge admin into INSERT/UPDATE/DELETE.
-- ============================================================
drop policy if exists "admins manage matchups" on bracket_matchups;
drop policy if exists "creator can insert matchups" on bracket_matchups;
drop policy if exists "creator can update matchups" on bracket_matchups;
drop policy if exists "creator can delete matchups" on bracket_matchups;

create policy "insert bracket_matchups"
  on bracket_matchups for insert
  with check (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update bracket_matchups"
  on bracket_matchups for update
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "delete bracket_matchups"
  on bracket_matchups for delete
  using (
    exists (
      select 1 from competitions
      where id = competition_id and created_by = (select auth.uid())
    )
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

-- ============================================================
-- matchup_votes
-- SELECT is public (true). Merge admin into INSERT; admin-only UPDATE/DELETE.
-- ============================================================
drop policy if exists "admins manage votes" on matchup_votes;
drop policy if exists "authenticated users can vote on open matchups" on matchup_votes;

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
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "update matchup_votes"
  on matchup_votes for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

create policy "delete matchup_votes"
  on matchup_votes for delete
  using (((select auth.jwt()) ->> 'role') = 'admin');
