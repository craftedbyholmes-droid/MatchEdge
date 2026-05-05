-- Phase 2A: Self-adapting engine + international player profiles
-- Run in Supabase SQL Editor

-- League weight profiles - one row per league, updated weekly
CREATE TABLE IF NOT EXISTS league_weights (
  league_name        TEXT PRIMARY KEY,
  standing_weight    NUMERIC DEFAULT 0.25,
  h2h_weight         NUMERIC DEFAULT 0.15,
  home_adv_weight    NUMERIC DEFAULT 0.10,
  odds_weight        NUMERIC DEFAULT 0.20,
  ai_pred_weight     NUMERIC DEFAULT 0.10,
  form_weight        NUMERIC DEFAULT 0.10,
  sidelined_weight   NUMERIC DEFAULT 0.05,
  intl_synergy_weight NUMERIC DEFAULT 0.05,
  sample_size        INT DEFAULT 0,
  last_calibrated    TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default weights for all leagues
INSERT INTO league_weights (league_name) VALUES
  ('Premier League'),('Premiership'),('Bundesliga'),
  ('La Liga'),('Ligue 1'),('Serie A'),('World Cup'),('Champions League')
ON CONFLICT (league_name) DO NOTHING;

-- Factor accuracy tracking - how well each factor predicted outcomes
CREATE TABLE IF NOT EXISTS factor_accuracy (
  id              BIGSERIAL PRIMARY KEY,
  league_name     TEXT NOT NULL,
  factor_name     TEXT NOT NULL,
  match_date      DATE NOT NULL,
  fixture_id      TEXT,
  predicted_home  NUMERIC,
  predicted_away  NUMERIC,
  actual_outcome  TEXT,
  factor_signal   TEXT,
  was_correct     BOOLEAN,
  score_gap       NUMERIC,
  goals_total     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_factor_accuracy_league ON factor_accuracy(league_name);
CREATE INDEX IF NOT EXISTS idx_factor_accuracy_factor ON factor_accuracy(factor_name);
CREATE INDEX IF NOT EXISTS idx_factor_accuracy_date   ON factor_accuracy(match_date);

-- Pending weight adaptations - shown in admin for confirmation
CREATE TABLE IF NOT EXISTS weight_adaptations (
  id              BIGSERIAL PRIMARY KEY,
  league_name     TEXT NOT NULL,
  factor_name     TEXT NOT NULL,
  current_weight  NUMERIC NOT NULL,
  suggested_weight NUMERIC NOT NULL,
  accuracy_change NUMERIC,
  sample_size     INT,
  reasoning       TEXT,
  status          TEXT DEFAULT 'pending',
  admin_override  NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_weight_adaptations_status ON weight_adaptations(status);

-- International player profiles
CREATE TABLE IF NOT EXISTS intl_player_profiles (
  profile_id         TEXT PRIMARY KEY,
  player_id          INTEGER NOT NULL,
  player_name        TEXT NOT NULL,
  country_team       TEXT NOT NULL,
  sd_player_id       INTEGER,
  intl_caps          INT DEFAULT 0,
  intl_goals         INT DEFAULT 0,
  intl_assists       INT DEFAULT 0,
  intl_avg_rating    NUMERIC DEFAULT 6.5,
  club_avg_rating    NUMERIC DEFAULT 6.5,
  intl_club_ratio    NUMERIC DEFAULT 1.0,
  tournament_boost   NUMERIC DEFAULT 1.0,
  adaptation_speed   NUMERIC DEFAULT 1.0,
  last_5_intl_ratings JSONB DEFAULT '[]'::jsonb,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intl_profiles_player ON intl_player_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_intl_profiles_country ON intl_player_profiles(country_team);

-- International teammate synergy
CREATE TABLE IF NOT EXISTS intl_synergy (
  synergy_id     TEXT PRIMARY KEY,
  player_a_id    INTEGER NOT NULL,
  player_b_id    INTEGER NOT NULL,
  country_team   TEXT NOT NULL,
  games_together INT DEFAULT 0,
  avg_combined_rating NUMERIC DEFAULT 6.5,
  goals_contributed   NUMERIC DEFAULT 0,
  synergy_score       NUMERIC DEFAULT 1.0,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intl_synergy_country ON intl_synergy(country_team);

-- International player vs opposition nation
CREATE TABLE IF NOT EXISTS intl_opposition_records (
  record_id      TEXT PRIMARY KEY,
  player_id      INTEGER NOT NULL,
  opposition     TEXT NOT NULL,
  games_played   INT DEFAULT 0,
  goals          INT DEFAULT 0,
  assists        INT DEFAULT 0,
  avg_rating     NUMERIC DEFAULT 6.5,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intl_opp_player ON intl_opposition_records(player_id);

-- Match prediction accuracy log
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id             BIGSERIAL PRIMARY KEY,
  fixture_id     TEXT NOT NULL,
  league_name    TEXT NOT NULL,
  match_date     DATE NOT NULL,
  predicted_home NUMERIC,
  predicted_away NUMERIC,
  predicted_winner TEXT,
  actual_home_score INT,
  actual_away_score INT,
  actual_outcome TEXT,
  result_correct BOOLEAN,
  goals_correct  BOOLEAN,
  score_gap_error NUMERIC,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pred_accuracy_league ON prediction_accuracy(league_name);
CREATE INDEX IF NOT EXISTS idx_pred_accuracy_date   ON prediction_accuracy(match_date);