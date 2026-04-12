-- Drop duplicate permissive delete policy on script_versions.
drop policy if exists "owners can delete versions of own scripts" on script_versions;
