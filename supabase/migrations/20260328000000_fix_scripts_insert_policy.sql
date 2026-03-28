-- Restore original insert policy: authenticated users only, submitted_by must match their uid
drop policy if exists "anyone can submit scripts" on scripts;

create policy "authenticated users can submit scripts"
  on scripts for insert
  with check (auth.uid() = submitted_by);
