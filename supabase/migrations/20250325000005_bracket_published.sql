-- Add bracket_published flag to competitions.
-- When false, bracket is only visible on the manage page (draft).
-- When true, bracket is visible publicly and cannot be regenerated.
alter table competitions add column bracket_published boolean not null default false;
