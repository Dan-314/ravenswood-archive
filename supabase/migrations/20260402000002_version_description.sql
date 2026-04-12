alter table script_versions add column description text;

-- Backfill from scripts table so existing versions have the current description
update script_versions sv
set description = s.description
from scripts s
where sv.script_id = s.id;
