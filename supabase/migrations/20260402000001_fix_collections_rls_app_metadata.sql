-- Fix collections and script_collections RLS policies to use app_metadata instead of
-- user_metadata. user_metadata is writable by end users and must not be used for
-- privilege checks. app_metadata is only writable by the service role.

DROP POLICY IF EXISTS "insert collections" ON collections;
DROP POLICY IF EXISTS "update collections" ON collections;
DROP POLICY IF EXISTS "delete collections" ON collections;
DROP POLICY IF EXISTS "insert script_collections" ON script_collections;
DROP POLICY IF EXISTS "update script_collections" ON script_collections;
DROP POLICY IF EXISTS "delete script_collections" ON script_collections;

CREATE POLICY "insert collections"
  ON collections FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "update collections"
  ON collections FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "delete collections"
  ON collections FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "insert script_collections"
  ON script_collections FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "update script_collections"
  ON script_collections FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "delete script_collections"
  ON script_collections FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
