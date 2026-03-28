-- Move pg_trgm extension out of public schema into extensions schema
alter extension pg_trgm set schema extensions;
