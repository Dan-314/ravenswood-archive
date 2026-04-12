-- Allow script owners to delete versions of their own scripts.
-- Works alongside the existing admin delete policy (permissive OR).
create policy "owners can delete versions of own scripts"
  on script_versions for delete
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = (select auth.uid())
    )
  );
