-- Run this in Supabase SQL Editor
ALTER TABLE matches ADD COLUMN IF NOT EXISTS league_code TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS sd_match_id INT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS excitement_rating NUMERIC;