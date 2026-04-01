-- Materialized counter on scripts table (publicly readable, already in select *)
alter table scripts add column download_count bigint not null default 0;

-- Event log table (admin-only reads, service role inserts)
create table script_downloads (
  id         uuid        primary key default gen_random_uuid(),
  script_id  uuid        not null references scripts(id) on delete cascade,
  ip_hash    text        not null,
  day_bucket date        not null default current_date,
  created_at timestamptz not null default now()
);

-- One count per IP per script per calendar day
create unique index script_downloads_dedup
  on script_downloads (script_id, ip_hash, day_bucket);

create index script_downloads_script_id on script_downloads (script_id);

alter table script_downloads enable row level security;

create policy "select script_downloads"
  on script_downloads for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Trigger: increment scripts.download_count only on real inserts (not ON CONFLICT ignores)
create or replace function increment_download_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update scripts set download_count = download_count + 1 where id = new.script_id;
  return new;
end;
$$;

create trigger script_downloads_after_insert
  after insert on script_downloads
  for each row execute function increment_download_count();

-- Atomic dedup insert — Supabase JS can't target functional indexes with .upsert()
create or replace function track_download(p_script_id uuid, p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into script_downloads (script_id, ip_hash, day_bucket)
  values (p_script_id, p_ip_hash, current_date)
  on conflict (script_id, ip_hash, day_bucket)
  do nothing;
end;
$$;

-- Enable Realtime on scripts table for live count updates on the detail page
alter publication supabase_realtime add table scripts;
