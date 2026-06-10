-- One display-name change per 30 days, enforced in the database so the
-- client cannot bypass it. Only applies to end-user (authenticated) requests;
-- service-role tooling (e.g. admin moderation) is exempt.
--
-- The initial name (set on profile creation) does not start the clock;
-- the first rename does.

alter table profiles add column display_name_changed_at timestamptz;

create or replace function check_display_name_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    if (select auth.role()) = 'authenticated'
      and old.display_name_changed_at is not null
      and old.display_name_changed_at > now() - interval '30 days' then
      raise exception 'You can change your display name again on %.',
        to_char(old.display_name_changed_at + interval '30 days', 'DD Mon YYYY');
    end if;
    new.display_name_changed_at = now();
  end if;
  return new;
end;
$$;

create trigger profiles_display_name_cooldown
  before update on profiles
  for each row execute function check_display_name_cooldown();
