-- Rate-limit comment creation so a scripted client cannot flood a script
-- with comments. Enforced in the database (the client talks to PostgREST
-- directly, so client-side checks are bypassable). Only applies to end-user
-- (authenticated) requests; service-role tooling is exempt.
--
-- Counts use the existing script_comments_user_id index, and security
-- definer ensures the count sees all of the user's comments regardless of
-- the caller's RLS visibility on scripts.

create or replace function check_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_minute int;
  last_hour int;
begin
  if (select auth.role()) <> 'authenticated' then
    return new;
  end if;

  select
    count(*) filter (where created_at > now() - interval '1 minute'),
    count(*)
  into last_minute, last_hour
  from script_comments
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if last_minute >= 5 then
    raise exception 'You are commenting too quickly. Please wait a minute and try again.';
  end if;
  if last_hour >= 60 then
    raise exception 'Hourly comment limit reached. Please try again later.';
  end if;

  return new;
end;
$$;

create trigger script_comments_rate_limit
  before insert on script_comments
  for each row execute function check_comment_rate_limit();
