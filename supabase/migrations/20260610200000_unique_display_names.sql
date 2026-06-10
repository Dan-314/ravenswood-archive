-- Enforce case-insensitive uniqueness of profile display names so users
-- cannot impersonate each other (e.g. mimic a script owner) in comments.

-- Dedupe first: oldest profile keeps the name, later ones get a numeric
-- suffix (truncated to stay within the 50-char check constraint).
with dupes as (
  select user_id,
         row_number() over (
           partition by lower(trim(display_name))
           order by created_at, user_id
         ) as rn
  from profiles
)
update profiles p
set display_name = left(trim(p.display_name), 46) || '-' || d.rn
from dupes d
where d.user_id = p.user_id and d.rn > 1;

create unique index profiles_display_name_unique
  on profiles (lower(trim(display_name)));
