-- Allow anyone to submit scripts (no login required)
drop policy if exists "authenticated users can submit scripts" on scripts;

create policy "anyone can submit scripts"
  on scripts for insert
  with check (true);

-- Users can read their own scripts (any status)
drop policy if exists "users can read own pending scripts" on scripts;

create policy "users can read own scripts"
  on scripts for select
  using (auth.uid() = submitted_by);

-- Users can update their own scripts
create policy "users can update own scripts"
  on scripts for update
  using (auth.uid() = submitted_by)
  with check (auth.uid() = submitted_by);

-- Users can delete their own scripts
create policy "users can delete own scripts"
  on scripts for delete
  using (auth.uid() = submitted_by);

-- Admins can update any script
create policy "admins can update scripts"
  on scripts for update
  using ((auth.jwt() ->> 'role') = 'admin');

-- Admins can delete any script
create policy "admins can delete scripts"
  on scripts for delete
  using ((auth.jwt() ->> 'role') = 'admin');
