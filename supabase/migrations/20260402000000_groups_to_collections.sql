-- Rename groups → collections, script_groups → script_collections.
-- Uses ALTER TABLE RENAME to preserve all data, indexes, and FK constraints.

-- Rename tables
ALTER TABLE groups RENAME TO collections;
ALTER TABLE script_groups RENAME TO script_collections;

-- Add description column
ALTER TABLE collections ADD COLUMN description text;

-- Rename foreign key column in junction table
ALTER TABLE script_collections RENAME COLUMN group_id TO collection_id;

-- Drop existing policies (after rename they are still attached to the tables under old names)
DROP POLICY IF EXISTS "insert groups" ON collections;
DROP POLICY IF EXISTS "update groups" ON collections;
DROP POLICY IF EXISTS "delete groups" ON collections;
DROP POLICY IF EXISTS "insert script_groups" ON script_collections;
DROP POLICY IF EXISTS "update script_groups" ON script_collections;
DROP POLICY IF EXISTS "delete script_groups" ON script_collections;

-- Recreate write policies under new names
-- (SELECT policies are already public from the initial schema and carry over unchanged)
CREATE POLICY "insert collections"
  ON collections FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "update collections"
  ON collections FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "delete collections"
  ON collections FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "insert script_collections"
  ON script_collections FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "update script_collections"
  ON script_collections FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "delete script_collections"
  ON script_collections FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
