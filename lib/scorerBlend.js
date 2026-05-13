import { fetchCachedUnitScores, blendUnitScores } from '@/lib/blendUnitScores.js';
import { scoreMatch as _scoreMatch } from '@/lib/scorer.js';

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