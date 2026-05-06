-- Add sd_league_id to matches table for competition filtering
ALTER TABLE matches ADD COLUMN IF NOT EXISTS sd_league_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_matches_sd_league ON matches(sd_league_id);

-- Update existing rows where we know the league
UPDATE matches SET sd_league_id = 228 WHERE league = 'Premier League' AND fixture_id LIKE 'sd_%';
UPDATE matches SET sd_league_id = 289 WHERE league = 'Premiership' AND fixture_id LIKE 'sd_%';
UPDATE matches SET sd_league_id = 241 WHERE league = 'Bundesliga' AND fixture_id LIKE 'sd_%';
UPDATE matches SET sd_league_id = 297 WHERE league = 'La Liga' AND fixture_id LIKE 'sd_%';
UPDATE matches SET sd_league_id = 235 WHERE league = 'Ligue 1' AND fixture_id LIKE 'sd_%';
UPDATE matches SET sd_league_id = 253 WHERE league = 'Serie A' AND fixture_id LIKE 'sd_%';