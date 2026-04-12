-- API keys for external consumers of the search API
create table api_keys (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  key_hash     text not null unique,
  created_at   timestamptz default now(),
  last_used_at timestamptz
);

-- No public access — only service role can read/write
alter table api_keys enable row level security;
