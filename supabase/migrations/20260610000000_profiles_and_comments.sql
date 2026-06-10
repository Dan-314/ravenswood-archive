-- Public profiles + script comments.
--
-- Profiles hold a user-chosen public display name. Commenting requires a
-- profile (enforced via FK), so email-derived names are never shown publicly.
--
-- Comments are YouTube-style: top-level comments plus one flat level of
-- replies. The schema (parent_id) allows deeper nesting later; depth is
-- enforced by trigger for now.

-- ============================================================
-- profiles
-- ============================================================

create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 50),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Display names are public.
create policy "select profiles"
  on profiles for select
  using (true);

create policy "insert profiles"
  on profiles for insert
  with check (user_id = (select auth.uid()));

create policy "update profiles"
  on profiles for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No delete policy: profile rows are removed via auth.users cascade.

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- script_comments
-- ============================================================

create table script_comments (
  id         uuid primary key default gen_random_uuid(),
  script_id  uuid not null references scripts(id) on delete cascade,
  user_id    uuid not null references profiles(user_id) on delete cascade,
  parent_id  uuid references script_comments(id) on delete cascade,
  content    text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index script_comments_script_id on script_comments (script_id, created_at);
create index script_comments_parent_id on script_comments (parent_id);
create index script_comments_user_id on script_comments (user_id);

create trigger script_comments_updated_at
  before update on script_comments
  for each row execute function update_updated_at();

-- Replies may only target top-level comments on the same script, and the
-- immutable columns cannot be repointed after insert.
create or replace function check_script_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent script_comments%rowtype;
begin
  if TG_OP = 'UPDATE' then
    if new.script_id <> old.script_id
      or new.user_id <> old.user_id
      or new.parent_id is distinct from old.parent_id then
      raise exception 'script_id, user_id and parent_id cannot be changed';
    end if;
    return new;
  end if;

  if new.parent_id is not null then
    select * into parent from script_comments where id = new.parent_id;
    if parent.parent_id is not null then
      raise exception 'replies to replies are not allowed';
    end if;
    if parent.script_id <> new.script_id then
      raise exception 'parent comment belongs to a different script';
    end if;
  end if;
  return new;
end;
$$;

create trigger script_comments_check_trigger
  before insert or update on script_comments
  for each row execute function check_script_comment();

alter table script_comments enable row level security;

-- Visibility follows the script: the subquery runs under the caller's RLS on
-- scripts, so comments on pending scripts are only visible to the owner/admin.
create policy "select script_comments"
  on script_comments for select
  using (exists (select 1 from scripts s where s.id = script_id));

create policy "insert script_comments"
  on script_comments for insert
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from scripts s where s.id = script_id)
  );

create policy "update script_comments"
  on script_comments for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "delete script_comments"
  on script_comments for delete
  using (
    user_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
