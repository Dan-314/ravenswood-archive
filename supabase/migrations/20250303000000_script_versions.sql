create table script_versions (
  id             uuid primary key default gen_random_uuid(),
  script_id      uuid not null references scripts(id) on delete cascade,
  version_number integer not null,
  name           text not null,
  author         text,
  script_type    text not null check (script_type in ('full', 'teensy')),
  has_carousel   boolean not null default false,
  character_ids  text[] not null default '{}',
  raw_json       jsonb not null,
  edited_by      uuid references auth.users(id) on delete set null,
  created_at     timestamptz default now(),
  unique (script_id, version_number)
);

create index script_versions_script_id on script_versions (script_id);
create index script_versions_script_id_version on script_versions (script_id, version_number desc);

-- RLS
alter table script_versions enable row level security;

create policy "versions of approved scripts are public"
  on script_versions for select
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.status = 'approved'
    )
  );

create policy "owners can read versions of own scripts"
  on script_versions for select
  using (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = auth.uid()
    )
  );

create policy "owners can insert versions of own scripts"
  on script_versions for insert
  with check (
    exists (
      select 1 from scripts s
      where s.id = script_versions.script_id and s.submitted_by = auth.uid()
    )
    and edited_by = auth.uid()
  );

create policy "admins can manage script_versions"
  on script_versions for all
  using ((auth.jwt() ->> 'role') = 'admin');

-- Seed version 1 for all existing scripts (bypass RLS for migration)
alter table script_versions disable row level security;

insert into script_versions (
  script_id, version_number, name, author, script_type,
  has_carousel, character_ids, raw_json, edited_by, created_at
)
select
  id, 1, name, author, script_type,
  has_carousel, character_ids, raw_json, submitted_by, created_at
from scripts;

alter table script_versions enable row level security;
