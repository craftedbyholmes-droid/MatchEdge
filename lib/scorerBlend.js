import { fetchCachedUnitScores, blendUnitScores } from './blendUnitScores.js';
import { scoreMatch as _scoreMatch } from './scorer.js';

export async function scoreMatchWithUnits(match, unitMap = null) {
  const engineResult = _scoreMatch(match);
  const map = unitMap ?? await fetchCachedUnitScores([match.fixture_id]);
  const { blendedHome, blendedAway, hasUnitData, unitData } = blendUnitScores(
    match.fixture_id,
    engineResult.total_home,
    engineResult.total_away,
    map
  );
  return {
    ...engineResult,
    engine_home:   engineResult.total_home,
    engine_away:   engineResult.total_away,
    total_home:    blendedHome,
    total_away:    blendedAway,
    has_unit_data: hasUnitData,
    unit_data:     unitData ?? null,
  };
}

// Use this in /api/cron/score/route.js instead of matches.map(scoreMatch)
// Before: const scored = matches.map(m => scoreMatch(m));
// After:  const scored = await scoreMatchesBatch(matches);
export async function scoreMatchesBatch(matches) {
  const unitMap = await fetchCachedUnitScores(matches.map((m) => m.fixture_id));
  return matches.map((m) => {
    const engineResult = _scoreMatch(m);
    const { blendedHome, blendedAway, hasUnitData, unitData } = blendUnitScores(
      m.fixture_id,
      engineResult.total_home,
      engineResult.total_away,
      unitMap
    );
    return {
      ...engineResult,
      engine_home:   engineResult.total_home,
      engine_away:   engineResult.total_away,
      total_home:    blendedHome,
      total_away:    blendedAway,
      has_unit_data: hasUnitData,
      unit_data:     unitData ?? null,
    };
  });
}