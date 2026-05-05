-- World Cup 2026 Tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wc_groups (
  group_id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wc_teams (
  team_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_id TEXT REFERENCES wc_groups(group_id),
  confederation TEXT,
  flag_url TEXT,
  sd_team_id INTEGER,
  played INT DEFAULT 0,
  wins INT DEFAULT 0,
  draws INT DEFAULT 0,
  losses INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  points INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wc_matches (
  match_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  group_id TEXT,
  home_team TEXT,
  away_team TEXT,
  home_team_id TEXT,
  away_team_id TEXT,
  kickoff_time TIMESTAMPTZ,
  venue TEXT,
  city TEXT,
  host_country TEXT,
  status TEXT DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  home_ht_score INT,
  away_ht_score INT,
  winner TEXT,
  sd_match_id INTEGER,
  score_state INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wc_match_scores (
  score_id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES wc_matches(match_id),
  score_state INT DEFAULT 1,
  total_home NUMERIC,
  total_away NUMERIC,
  momentum_direction TEXT,
  momentum_strength NUMERIC,
  modifiers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wc_picks (
  pick_id TEXT PRIMARY KEY,
  persona TEXT NOT NULL,
  match_id TEXT REFERENCES wc_matches(match_id),
  market TEXT,
  selection TEXT,
  odds_fractional TEXT,
  odds_decimal NUMERIC,
  engine_score NUMERIC,
  is_best_pick BOOLEAN DEFAULT FALSE,
  stake NUMERIC,
  tip_text TEXT,
  pick_date DATE,
  outcome TEXT,
  profit_loss NUMERIC DEFAULT 0,
  settled_at TIMESTAMPTZ
);

-- Seed all 12 groups A-L
INSERT INTO wc_groups (group_id, group_name) VALUES
  ('A','Group A'),('B','Group B'),('C','Group C'),('D','Group D'),
  ('E','Group E'),('F','Group F'),('G','Group G'),('H','Group H'),
  ('I','Group I'),('J','Group J'),('K','Group K'),('L','Group L')
ON CONFLICT (group_id) DO NOTHING;

-- Seed all 48 qualified teams with groups
INSERT INTO wc_teams (team_id, name, group_id, confederation) VALUES
  ('usa','United States','A','CONCACAF'),
  ('pan','Panama','A','CONCACAF'),
  ('hon','Honduras','A','CONCACAF'),
  ('yem','Yemen','A','AFC'),
  ('mex','Mexico','B','CONCACAF'),
  ('qat','Qatar','B','AFC'),
  ('cub','Cuba','B','CONCACAF'),
  ('nen','New Zealand','B','OFC'),
  ('can','Canada','C','CONCACAF'),
  ('uru','Uruguay','C','CONMEBOL'),
  ('crc','Costa Rica','C','CONCACAF'),
  ('isl','Iceland','C','UEFA'),
  ('bra','Brazil','D','CONMEBOL'),
  ('eng','England','D','UEFA'),
  ('aus','Australia','D','AFC'),
  ('civ','Ivory Coast','D','CAF'),
  ('arg','Argentina','E','CONMEBOL'),
  ('fra','France','E','UEFA'),
  ('alb','Albania','E','UEFA'),
  ('ngr','Nigeria','E','CAF'),
  ('ger','Germany','F','UEFA'),
  ('prt','Portugal','F','UEFA'),
  ('esp','Spain','F','UEFA'),
  ('mar','Morocco','F','CAF'),
  ('bel','Belgium','G','UEFA'),
  ('ned','Netherlands','G','UEFA'),
  ('egy','Egypt','G','CAF'),
  ('sen','Senegal','G','CAF'),
  ('col','Colombia','H','CONMEBOL'),
  ('mex2','Ecuador','H','CONMEBOL'),
  ('svk','Slovakia','H','UEFA'),
  ('cmr','Cameroon','H','CAF'),
  ('ita','Italy','I','UEFA'),
  ('cro','Croatia','I','UEFA'),
  ('jpn','Japan','I','AFC'),
  ('tun','Tunisia','I','CAF'),
  ('kor','South Korea','J','AFC'),
  ('sui','Switzerland','J','UEFA'),
  ('pol','Poland','J','UEFA'),
  ('tgo','Togo','J','CAF'),
  ('den','Denmark','K','UEFA'),
  ('aut','Austria','K','UEFA'),
  ('tur','Turkey','K','UEFA'),
  ('irq','Iraq','K','AFC'),
  ('mli','Mali','L','CAF'),
  ('srb','Serbia','L','UEFA'),
  ('ukr','Ukraine','L','UEFA'),
  ('ven','Venezuela','L','CONMEBOL')
ON CONFLICT (team_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_wc_matches_stage ON wc_matches(stage);
CREATE INDEX IF NOT EXISTS idx_wc_matches_group ON wc_matches(group_id);
CREATE INDEX IF NOT EXISTS idx_wc_picks_persona ON wc_picks(persona);
CREATE INDEX IF NOT EXISTS idx_wc_teams_group ON wc_teams(group_id);