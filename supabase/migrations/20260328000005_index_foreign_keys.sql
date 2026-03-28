-- Add missing indexes on unindexed foreign key columns
create index bracket_matchups_entry_a    on bracket_matchups (entry_a_id);
create index bracket_matchups_entry_b    on bracket_matchups (entry_b_id);
create index bracket_matchups_winner     on bracket_matchups (winner_entry_id);
create index matchup_votes_entry         on matchup_votes (entry_id);
create index script_groups_group         on script_groups (group_id);
create index script_groups_script        on script_groups (script_id);
create index competition_entries_submitted_by on competition_entries (submitted_by);
create index matchup_votes_user             on matchup_votes (user_id);
create index script_versions_edited_by      on script_versions (edited_by);
create index scripts_submitted_by           on scripts (submitted_by);
