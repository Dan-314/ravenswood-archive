-- Materialized counter on scripts table
alter table scripts add column favourite_count bigint not null default 0;

-- One row per user per script
create table script_favourites (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  script_id  uuid        not null references scripts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, script_id)
);

create index script_favourites_user_id on script_favourites (user_id);
create index script_favourites_script_id on script_favourites (script_id);

alter table script_favourites enable row level security;

create policy "select script_favourites"
  on script_favourites for select
  using (user_id = (select auth.uid()));

create policy "insert script_favourites"
  on script_favourites for insert
  with check (user_id = (select auth.uid()));

create policy "delete script_favourites"
  on script_favourites for delete
  using (user_id = (select auth.uid()));

-- Trigger to keep favourite_count in sync (fires on INSERT and DELETE)
create or replace function update_favourite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update scripts set favourite_count = favourite_count + 1 where id = new.script_id;
  elsif TG_OP = 'DELETE' then
    update scripts set favourite_count = greatest(0, favourite_count - 1) where id = old.script_id;
  end if;
  return null;
end;
$$;

create trigger script_favourites_count_trigger
  after insert or delete on script_favourites
  for each row execute function update_favourite_count();
