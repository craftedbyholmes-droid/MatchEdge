-- Player stats cache from API Football
CREATE TABLE IF NOT EXISTS player_stats_cache (
  player_id       INTEGER NOT NULL,
  af_player_id    INTEGER,
  player_name     TEXT,
  season          INTEGER NOT NULL DEFAULT 2024,
  league_id       INTEGER,
  position        TEXT,
  rating          NUMERIC,
  appearances     INTEGER DEFAULT 0,
  minutes         INTEGER DEFAULT 0,
  goals           INTEGER DEFAULT 0,
  assists         INTEGER DEFAULT 0,
  shots_total     INTEGER DEFAULT 0,
  shots_on        INTEGER DEFAULT 0,
  key_passes      INTEGER DEFAULT 0,
  duels_total     INTEGER DEFAULT 0,
  duels_won       INTEGER DEFAULT 0,
  dribbles_att    INTEGER DEFAULT 0,
  dribbles_succ   INTEGER DEFAULT 0,
  tackles         INTEGER DEFAULT 0,
  interceptions   INTEGER DEFAULT 0,
  blocks          INTEGER DEFAULT 0,
  yellow_cards    INTEGER DEFAULT 0,
  red_cards       INTEGER DEFAULT 0,
  composite_rating NUMERIC,
  goalscorer_prob  NUMERIC,
  raw_stats       JSONB,
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats_cache(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_fetched ON player_stats_cache(fetched_at);

-- AF fixture ID mapping cache
CREATE TABLE IF NOT EXISTS af_fixture_map (
  fixture_id      TEXT PRIMARY KEY,
  af_fixture_id   INTEGER,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unit interaction scores cache
CREATE TABLE IF NOT EXISTS unit_scores (
  fixture_id           TEXT PRIMARY KEY,
  home_attack_score    NUMERIC,
  home_midfield_score  NUMERIC,
  home_defence_score   NUMERIC,
  away_attack_score    NUMERIC,
  away_midfield_score  NUMERIC,
  away_defence_score   NUMERIC,
  attack_clash_home    NUMERIC,
  attack_clash_away    NUMERIC,
  midfield_clash       NUMERIC,
  unit_total_home      NUMERIC,
  unit_total_away      NUMERIC,
  top_scorers_home     JSONB,
  top_scorers_away     JSONB,
  calculated_at        TIMESTAMPTZ DEFAULT NOW()
);