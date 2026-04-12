-- Script claiming system.
-- Allows users to request ownership of scripts they didn't submit.
-- All claims require admin review before ownership is transferred.

create type claim_status as enum ('pending', 'approved', 'rejected');

create table script_claims (
  id                    uuid        primary key default gen_random_uuid(),
  script_id             uuid        not null references scripts(id) on delete cascade,
  claimant_id           uuid        not null references auth.users(id) on delete cascade,
  claimant_display_name text        not null,
  message               text,
  status                claim_status not null default 'pending',
  reviewed_by           uuid        references auth.users(id),
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  unique (script_id, claimant_id)
);

alter table script_claims enable row level security;

-- Users can see their own claims; admins can see all.
create policy "select script_claims"
  on script_claims for select
  using (
    claimant_id = (select auth.uid())
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

-- Authenticated users can submit claims for themselves.
create policy "insert script_claims"
  on script_claims for insert
  with check (
    claimant_id = (select auth.uid())
  );

-- Only admins can update claims (approve/reject).
create policy "update script_claims"
  on script_claims for update
  using (((select auth.jwt()) ->> 'role') = 'admin');

-- Users can retract their own pending claims; admins can delete any.
create policy "delete script_claims"
  on script_claims for delete
  using (
    (claimant_id = (select auth.uid()) and status = 'pending')
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create index on script_claims (script_id);
create index on script_claims (claimant_id);
create index on script_claims (status) where status = 'pending';
