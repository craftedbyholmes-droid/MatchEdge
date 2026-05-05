-- MATCHEDGE Supabase Schema -- paste into Supabase SQL Editor and run
CREATE TABLE IF NOT EXISTS matches (
  fixture_id TEXT PRIMARY KEY, home_team TEXT NOT NULL, away_team TEXT NOT NULL,
  league TEXT NOT NULL, season TEXT NOT NULL DEFAULT '2025/26',
  kickoff_time TIMESTAMPTZ, gameweek INT, venue TEXT, status TEXT DEFAULT 'scheduled',
  home_score INT, away_score INT, score_state INT DEFAULT 1,
  score_version JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY, name TEXT NOT NULL, team_id TEXT, position TEXT, age INT,
  nationality TEXT, season_stats JSONB DEFAULT '{}'::jsonb, form_last_10 JSONB DEFAULT '[]'::jsonb,
  injury_status TEXT DEFAULT 'available', injury_return_date DATE, transfer_date DATE,
  adaptation_multiplier NUMERIC DEFAULT 1.0, recovery_modifier NUMERIC DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY, name TEXT NOT NULL, league TEXT, stadium TEXT, manager TEXT,
  formation_profile JSONB DEFAULT '{}'::jsonb, manager_ppda NUMERIC DEFAULT 9.0);
CREATE TABLE IF NOT EXISTS managers (
  manager_id TEXT PRIMARY KEY, name TEXT NOT NULL, team_id TEXT,
  formation_profile JSONB DEFAULT '{}'::jsonb, ppda NUMERIC DEFAULT 9.0,
  updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS referees (
  referee_id TEXT PRIMARY KEY, name TEXT NOT NULL, cards_per_game NUMERIC DEFAULT 4.0,
  updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS fixture_units (
  unit_id TEXT PRIMARY KEY, fixture_id TEXT REFERENCES matches(fixture_id),
  team TEXT, unit_type TEXT, player_ids TEXT[], raw_ratings NUMERIC[],
  synergy_modifier NUMERIC DEFAULT 1.0, unit_score NUMERIC DEFAULT 50,
  score_state INT DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS match_scores (
  score_id TEXT PRIMARY KEY, fixture_id TEXT REFERENCES matches(fixture_id),
  score_state INT, home_advantage NUMERIC, away_advantage NUMERIC,
  central_clash NUMERIC, wide_battle NUMERIC, set_piece NUMERIC, form_momentum NUMERIC,
  modifiers JSONB DEFAULT '{}'::jsonb, total_home NUMERIC, total_away NUMERIC,
  momentum_direction TEXT DEFAULT 'neutral', momentum_strength NUMERIC DEFAULT 0,
  correct_score_prediction JSONB, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS bench_impacts (
  impact_id TEXT PRIMARY KEY, fixture_id TEXT REFERENCES matches(fixture_id),
  player_id TEXT, team TEXT, likely_position TEXT, replaces_player_id TEXT,
  unit_score_before NUMERIC, unit_score_after NUMERIC, delta NUMERIC, flagged BOOLEAN DEFAULT FALSE);
CREATE TABLE IF NOT EXISTS results (
  result_id TEXT PRIMARY KEY, fixture_id TEXT REFERENCES matches(fixture_id),
  home_score INT, away_score INT, outcome TEXT, btts BOOLEAN, total_goals INT,
  player_stats JSONB DEFAULT '{}'::jsonb, settled_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS persona_picks (
  pick_id TEXT PRIMARY KEY, persona TEXT NOT NULL, fixture_id TEXT, market TEXT,
  selection TEXT, odds_fractional TEXT, odds_decimal NUMERIC, engine_score NUMERIC,
  score_state INT DEFAULT 1, is_best_pick BOOLEAN DEFAULT FALSE, stake NUMERIC,
  tip_text TEXT, pick_date DATE, outcome TEXT, profit_loss NUMERIC DEFAULT 0, settled_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS persona_season (
  persona TEXT PRIMARY KEY, total_picks INT DEFAULT 0, wins INT DEFAULT 0,
  losses INT DEFAULT 0, voids INT DEFAULT 0, total_staked NUMERIC DEFAULT 0,
  total_returned NUMERIC DEFAULT 0, profit_loss NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0, roi NUMERIC DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO persona_season (persona) VALUES ('gordon'),('stan'),('pez') ON CONFLICT (persona) DO NOTHING;
CREATE TABLE IF NOT EXISTS social_posts (
  post_id TEXT PRIMARY KEY, persona TEXT NOT NULL, posted_date DATE, fixture_id TEXT,
  home_team TEXT, away_team TEXT, market TEXT, selection TEXT, odds_fractional TEXT,
  odds_decimal NUMERIC, engine_score NUMERIC, stake NUMERIC DEFAULT 10, outcome TEXT,
  final_score TEXT, profit_loss NUMERIC DEFAULT 0, platforms_posted TEXT[],
  post_text_short TEXT, post_text_long TEXT, post_text_fb TEXT,
  result_text_short TEXT, tip_text TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS persona_social_season (
  persona TEXT PRIMARY KEY, total_posted INT DEFAULT 0, wins INT DEFAULT 0,
  losses INT DEFAULT 0, voids INT DEFAULT 0, total_staked NUMERIC DEFAULT 0,
  total_returned NUMERIC DEFAULT 0, profit_loss NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO persona_social_season (persona) VALUES ('gordon'),('stan'),('pez') ON CONFLICT (persona) DO NOTHING;
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY, user_id UUID UNIQUE REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free', expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY, value JSONB, date DATE, updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO cache (key,value) VALUES ('matches_today','[]'::jsonb),('matches_tomorrow','[]'::jsonb) ON CONFLICT (key) DO NOTHING;
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name TEXT PRIMARY KEY, enabled BOOLEAN DEFAULT TRUE, plan_restriction TEXT);
INSERT INTO feature_flags (flag_name,enabled,plan_restriction) VALUES
  ('momentum_gauge',true,'pro'),('matchday_video',false,'pro'),('correct_score',false,'pro'),
  ('formation_interaction',true,null),('setup_chain',true,null),('bench_impact',true,'edge')
ON CONFLICT (flag_name) DO NOTHING;
CREATE TABLE IF NOT EXISTS player_combinations (
  combo_id TEXT PRIMARY KEY, player_a_id TEXT, player_b_id TEXT, combo_type TEXT,
  base_amplifier NUMERIC DEFAULT 1.0, games_together INT DEFAULT 0,
  goals_per_90_together NUMERIC DEFAULT 0, goals_per_90_apart_a NUMERIC DEFAULT 0,
  goals_per_90_apart_b NUMERIC DEFAULT 0, combo_score NUMERIC DEFAULT 1.0,
  manually_seeded BOOLEAN DEFAULT FALSE, active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS player_goal_types (
  player_id TEXT PRIMARY KEY, cross_finish NUMERIC DEFAULT 0.2,
  throughball NUMERIC DEFAULT 0.2, cutback NUMERIC DEFAULT 0.2,
  longrange NUMERIC DEFAULT 0.2, press_turnover NUMERIC DEFAULT 0.2,
  sample_goals INT DEFAULT 0, confidence NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
ALTER TABLE persona_picks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read persona_picks" ON persona_picks;
CREATE POLICY "Public read persona_picks" ON persona_picks FOR SELECT USING (true);
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read social_posts" ON social_posts;
CREATE POLICY "Public read social_posts" ON social_posts FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_persona_picks_date    ON persona_picks(pick_date);
CREATE INDEX IF NOT EXISTS idx_persona_picks_persona ON persona_picks(persona);
CREATE INDEX IF NOT EXISTS idx_social_posts_date     ON social_posts(posted_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_persona  ON social_posts(persona);
CREATE INDEX IF NOT EXISTS idx_match_scores_fixture  ON match_scores(fixture_id);
CREATE INDEX IF NOT EXISTS idx_fixture_units_fixture ON fixture_units(fixture_id);
CREATE INDEX IF NOT EXISTS idx_bench_impacts_fixture ON bench_impacts(fixture_id);