-- Add semantic version label (e.g. "1.0.0") to scripts and script_versions
-- Existing rows get '0' (unversioned), new rows default to '1.0.0'
alter table scripts add column version_label text not null default '0';
alter table script_versions add column version_label text not null default '0';
alter table scripts alter column version_label set default '1.0.0';
alter table script_versions alter column version_label set default '1.0.0';

-- Allow script owners to update version_label on their own script versions
create policy "owners can update versions of own scripts"
  on script_versions for update
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = auth.uid()
    )
  );
