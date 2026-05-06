-- Player stat tables built from match events
-- We accumulate these ourselves since the API has no player stats endpoint

CREATE TABLE IF NOT EXISTS player_season_stats (
  stat_id        TEXT PRIMARY KEY,
  player_id      INTEGER NOT NULL,
  player_name    TEXT,
  team_id        INTEGER,
  team_name      TEXT,
  league_id      INTEGER,
  season         TEXT DEFAULT '2025/26',
  appearances    INT DEFAULT 0,
  goals          INT DEFAULT 0,
  own_goals      INT DEFAULT 0,
  penalties      INT DEFAULT 0,
  yellow_cards   INT DEFAULT 0,
  red_cards      INT DEFAULT 0,
  subs_on        INT DEFAULT 0,
  subs_off       INT DEFAULT 0,
  goals_per_90   NUMERIC DEFAULT 0,
  cards_per_90   NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pss_player ON player_season_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_pss_team   ON player_season_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_pss_league ON player_season_stats(league_id);

-- Match event log - raw events from every settled match
CREATE TABLE IF NOT EXISTS match_event_log (
  event_id       TEXT PRIMARY KEY,
  fixture_id     TEXT NOT NULL,
  match_date     DATE,
  league_id      INTEGER,
  player_id      INTEGER,
  player_name    TEXT,
  team_id        INTEGER,
  side           TEXT,
  event_type     TEXT,
  minute         INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mel_fixture ON match_event_log(fixture_id);
CREATE INDEX IF NOT EXISTS idx_mel_player  ON match_event_log(player_id);
CREATE INDEX IF NOT EXISTS idx_mel_league  ON match_event_log(league_id);

-- Sidelined log - track injury history per player
CREATE TABLE IF NOT EXISTS player_sidelined_log (
  log_id         TEXT PRIMARY KEY,
  player_id      INTEGER NOT NULL,
  player_name    TEXT,
  team_id        INTEGER,
  fixture_id     TEXT,
  status         TEXT,
  injury_desc    TEXT,
  logged_date    DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_psl_player ON player_sidelined_log(player_id);

-- Transfer adaptation tracker
CREATE TABLE IF NOT EXISTS player_transfers (
  transfer_id    TEXT PRIMARY KEY,
  player_id      INTEGER NOT NULL,
  player_name    TEXT,
  to_team_id     INTEGER,
  to_team_name   TEXT,
  from_team_name TEXT,
  transfer_date  DATE,
  fee_eur        NUMERIC DEFAULT 0,
  days_since     INT DEFAULT 0,
  adaptation_mult NUMERIC DEFAULT 0.65,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pt_player ON player_transfers(player_id);
CREATE INDEX IF NOT EXISTS idx_pt_team   ON player_transfers(to_team_id);

-- League standings snapshot - refreshed daily
CREATE TABLE IF NOT EXISTS league_standings (
  standing_id    TEXT PRIMARY KEY,
  league_id      INTEGER NOT NULL,
  season         TEXT DEFAULT '2025/26',
  stage_name     TEXT,
  position       INT,
  team_id        INTEGER,
  team_name      TEXT,
  games_played   INT,
  points         INT,
  wins           INT,
  draws          INT,
  losses         INT,
  goals_for      INT,
  goals_against  INT,
  goal_diff      INT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ls_unique ON league_standings(league_id, team_id);
CREATE INDEX IF NOT EXISTS idx_ls_league ON league_standings(league_id);