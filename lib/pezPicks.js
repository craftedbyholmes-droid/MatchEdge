import { supabase } from './supabase.js';

const PEZ_MAX_PICKS        = 4;
const PEZ_MIN_ENGINE_SCORE = 62;

export async function generatePezPicks(scoredMatches, pickDate) {
  if (!scoredMatches || scoredMatches.length === 0) return [];

  const fixtureIds = scoredMatches.map((m) => m.fixture_id);
  const { data: unitRows } = await supabase
    .from('unit_scores')
    .select('fixture_id, top_scorers_home, top_scorers_away, attack_clash_home, attack_clash_away')
    .in('fixture_id', fixtureIds);

  const unitMap    = new Map((unitRows || []).map((r) => [r.fixture_id, r]));
  const candidates = [];

  for (const match of scoredMatches) {
    const homeAdv = match.total_home ?? 0;
    const awayAdv = match.total_away ?? 0;
    if (Math.max(homeAdv, awayAdv) < PEZ_MIN_ENGINE_SCORE) continue;

    const unit         = unitMap.get(match.fixture_id);
    const homeStronger = homeAdv >= awayAdv;
    const primary      = homeStronger ? (unit?.top_scorers_home ?? []) : (unit?.top_scorers_away ?? []);
    const secondary    = homeStronger ? (unit?.top_scorers_away ?? []) : (unit?.top_scorers_home ?? []);
    const clash        = homeStronger ? (unit?.attack_clash_home ?? homeAdv) : (unit?.attack_clash_away ?? awayAdv);

    if (primary.length > 0) {
      const top = primary[0];
      candidates.push({
        fixture_id:   match.fixture_id,
        home_team:    match.home_team,
        away_team:    match.away_team,
        league:       match.league,
        kickoff_time: match.kickoff_time,
        selection:    top.name,
        engine_score: clash,
        rank: (clash * 0.6) + ((top.goalscorer_prob ?? 0) * 100 * 0.4),
      });
    }

    if (secondary.length > 0 && Math.abs(homeAdv - awayAdv) < 15) {
      const top      = secondary[0];
      const secClash = homeStronger ? (unit?.attack_clash_away ?? awayAdv) : (unit?.attack_clash_home ?? homeAdv);
      candidates.push({
        fixture_id:   match.fixture_id,
        home_team:    match.home_team,
        away_team:    match.away_team,
        league:       match.league,
        kickoff_time: match.kickoff_time,
        selection:    top.name,
        engine_score: secClash,
        rank: (secClash * 0.6) + ((top.goalscorer_prob ?? 0) * 100 * 0.4),
      });
    }
  }

  if (candidates.length === 0) return _pezFallback(scoredMatches, pickDate);

  candidates.sort((a, b) => b.rank - a.rank);
  const seen     = new Set();
  const selected = [];
  for (const c of candidates) {
    if (seen.has(c.fixture_id)) continue;
    seen.add(c.fixture_id);
    selected.push(c);
    if (selected.length >= PEZ_MAX_PICKS) break;
  }

  return selected.map((c, i) => ({
    pick_id:         'pez_' + c.fixture_id + '_anytime_scorer_' + pickDate,
    persona:         'pez',
    fixture_id:      c.fixture_id,
    home_team:       c.home_team,
    away_team:       c.away_team,
    league:          c.league,
    kickoff_time:    c.kickoff_time,
    market:          'anytime_scorer',
    selection:       c.selection,
    odds_fractional: null,
    odds_decimal:    null,
    engine_score:    Math.round(c.engine_score * 10) / 10,
    score_gap:       null,
    is_best_pick:    i === 0,
    stake:           i === 0 ? 10 : 5,
    tip_text:        null,
    pick_date:       pickDate,
    outcome:         null,
    profit_loss:     null,
  }));
}

function _pezFallback(scoredMatches, pickDate) {
  const sorted = [...scoredMatches]
    .filter((m) => Math.max(m.total_home ?? 0, m.total_away ?? 0) >= PEZ_MIN_ENGINE_SCORE)
    .sort((a, b) => Math.max(b.total_home ?? 0, b.total_away ?? 0) - Math.max(a.total_home ?? 0, a.total_away ?? 0))
    .slice(0, PEZ_MAX_PICKS);
  return sorted.map((m, i) => {
    const homeStronger = (m.total_home ?? 0) >= (m.total_away ?? 0);
    return {
      pick_id:         'pez_' + m.fixture_id + '_anytime_scorer_' + pickDate,
      persona:         'pez',
      fixture_id:      m.fixture_id,
      home_team:       m.home_team,
      away_team:       m.away_team,
      league:          m.league,
      kickoff_time:    m.kickoff_time,
      market:          'anytime_scorer',
      selection:       (homeStronger ? m.home_team : m.away_team) + ' top scorer',
      odds_fractional: null,
      odds_decimal:    null,
      engine_score:    Math.max(m.total_home ?? 0, m.total_away ?? 0),
      score_gap:       null,
      is_best_pick:    i === 0,
      stake:           i === 0 ? 10 : 5,
      tip_text:        null,
      pick_date:       pickDate,
      outcome:         null,
      profit_loss:     null,
    };
  });
}