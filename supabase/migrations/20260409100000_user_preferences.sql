-- User preferences for default script display & translation settings
create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "users can read own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "users can insert own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "users can update own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);

create policy "users can delete own preferences"
  on user_preferences for delete
  using (auth.uid() = user_id);
