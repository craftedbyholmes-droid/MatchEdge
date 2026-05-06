-- Add team ID columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);