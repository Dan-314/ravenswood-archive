-- Enable Supabase Realtime for matchup_votes so vote counts update live
alter publication supabase_realtime add table matchup_votes;
