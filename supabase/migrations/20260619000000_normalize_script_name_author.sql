-- Make the name/author uniqueness constraint normalization-proof.
--
-- The old index `scripts_name_author_unique` compared name/author as raw text,
-- so a stray trailing space (or other whitespace difference) let duplicate
-- scripts slip past it. Trim existing rows and enforce uniqueness on the
-- trimmed values so the DB rejects whitespace-only differences regardless of
-- what the client sends.
--
-- NOTE: this is non-destructive. If any post-trim duplicates already exist in
-- prod (e.g. the two "Trouble Brewing" rows), delete the duplicate row FIRST,
-- otherwise the unique index recreation below will fail.

UPDATE scripts
  SET name = btrim(name),
      author = btrim(author)
  WHERE name <> btrim(name)
     OR author <> btrim(author);

DROP INDEX scripts_name_author_unique;

CREATE UNIQUE INDEX scripts_name_author_unique
  ON scripts (btrim(name), btrim(author));
