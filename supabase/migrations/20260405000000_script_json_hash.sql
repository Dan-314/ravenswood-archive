ALTER TABLE scripts
  ADD COLUMN json_hash text GENERATED ALWAYS AS (md5(raw_json::text)) STORED;

-- Remove duplicates, keeping the oldest row per json_hash
DELETE FROM scripts a
  USING scripts b
  WHERE a.json_hash = b.json_hash
    AND a.created_at > b.created_at;

CREATE UNIQUE INDEX scripts_json_hash_unique ON scripts (json_hash);
