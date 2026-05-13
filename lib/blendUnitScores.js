import { supabase } from './supabase.js';

export async function fetchCachedUnitScores(fixtureIds) {
  if (!fixtureIds || fixtureIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('unit_scores')
    .select('*')
    .in('fixture_id', fixtureIds);
  if (error) {
    console.error('[blendUnitScores] fetch error:', error.message);
    return new Map();
  }
  const map = new Map();
  for (const row of data || []) {
    map.set(row.fixture_id, row);
  }
  return map;
}

export function blendUnitScores(fixtureId, engineHome, engineAway, unitScoreMap) {
  const unit = unitScoreMap.get(fixtureId);
  if (!unit || unit.unit_total_home == null || unit.unit_total_away == null) {
    return { blendedHome: engineHome, blendedAway: engineAway, hasUnitData: false };
  }
  const ENGINE_WEIGHT = 0.75;
  const UNIT_WEIGHT = 0.25;
  const blendedHome = Math.round((engineHome * ENGINE_WEIGHT + unit.unit_total_home * UNIT_WEIGHT) * 10) / 10;
  const blendedAway = Math.round((engineAway * ENGINE_WEIGHT + unit.unit_total_away * UNIT_WEIGHT) * 10) / 10;
  return {
    blendedHome,
    blendedAway,
    hasUnitData: true,
    unitData: {
      homeAttack:      unit.home_attack_score,
      homeMidfield:    unit.home_midfield_score,
      homeDefence:     unit.home_defence_score,
      awayAttack:      unit.away_attack_score,
      awayMidfield:    unit.away_midfield_score,
      awayDefence:     unit.away_defence_score,
      attackClashHome: unit.attack_clash_home,
      attackClashAway: unit.attack_clash_away,
      midfieldClash:   unit.midfield_clash,
      topScorersHome:  unit.top_scorers_home || [],
      topScorersAway:  unit.top_scorers_away || [],
    },
  };
}

export async function applyBlendToMatches(matches) {
  if (!matches || matches.length === 0) return;
  const ids = matches.map((m) => m.fixture_id);
  const unitMap = await fetchCachedUnitScores(ids);
  for (const match of matches) {
    const result = blendUnitScores(match.fixture_id, match.total_home ?? 50, match.total_away ?? 50, unitMap);
    match.blended_home  = result.blendedHome;
    match.blended_away  = result.blendedAway;
    match.has_unit_data = result.hasUnitData;
    if (result.unitData) match.unit_data = result.unitData;
  }
}