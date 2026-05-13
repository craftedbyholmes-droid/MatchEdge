import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { verifyCronAuth } from '../../../../lib/cronAuth.js';

const ATTACK_POSITIONS  = ['ST', 'CF', 'LW', 'RW', 'AM', 'SS'];
const DEFENCE_POSITIONS = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK', 'SW'];

function classifyPosition(pos) {
  if (!pos) return 'midfield';
  const p = pos.toUpperCase();
  if (ATTACK_POSITIONS.some((x) => p.includes(x)))  return 'attack';
  if (DEFENCE_POSITIONS.some((x) => p.includes(x))) return 'defence';
  return 'midfield';
}

function scoreUnit(players, unitType) {
  if (!players || players.length === 0) return 50;
  const scores = players.map((p) => {
    const r    = p.composite_rating ?? p.rating ?? 6.5;
    const base = r > 10 ? r : r * 10;
    let bonus  = 0;
    if (unitType === 'attack') {
      bonus += (p.goals ?? 0) * 2.5;
      bonus += (p.assists ?? 0) * 1.5;
      bonus += (p.key_passes ?? 0) * 0.8;
      bonus += (p.shots_on ?? 0) * 0.5;
      bonus -= (p.yellow_cards ?? 0) * 1.0;
    } else if (unitType === 'midfield') {
      bonus += (p.key_passes ?? 0) * 1.2;
      bonus += (p.assists ?? 0) * 1.5;
      bonus += (p.tackles ?? 0) * 0.5;
      bonus += (p.interceptions ?? 0) * 0.5;
      bonus -= (p.yellow_cards ?? 0) * 0.8;
    } else {
      bonus += (p.tackles ?? 0) * 1.0;
      bonus += (p.interceptions ?? 0) * 1.0;
      bonus += (p.blocks ?? 0) * 0.8;
      bonus -= (p.goals ?? 0) * 1.5;
      bonus -= (p.yellow_cards ?? 0) * 1.2;
      bonus -= (p.red_cards ?? 0) * 4.0;
    }
    return Math.min(100, Math.max(0, base + bonus));
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

function calcClash(attackScore, defenceScore) {
  const raw = (attackScore * 0.55) - (defenceScore * 0.45) + 50;
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
}

function calcMidfieldClash(homeMid, awayMid) {
  return Math.round((homeMid - awayMid) * 10) / 10;
}

function calcUnitTotal(attackClash, midfieldClash, defenceScore) {
  const midBonus = Math.max(0, midfieldClash) * 0.3;
  const raw = (attackClash * 0.50) + midBonus + (defenceScore * 0.20);
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
}

export async function GET(request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: matches, error: matchErr } = await supabase
      .from('matches')
      .select('fixture_id, home_team_id, away_team_id, league, sd_league_id')
      .in('status', ['scheduled', 'live', 'upcoming'])
      .order('kickoff_time', { ascending: true })
      .limit(50);

    if (matchErr) throw matchErr;
    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, message: 'No upcoming matches to score', scored: 0 });
    }

    const { data: existing } = await supabase
      .from('unit_scores')
      .select('fixture_id, calculated_at')
      .in('fixture_id', matches.map((m) => m.fixture_id));

    const freshSet = new Set(
      (existing || [])
        .filter((r) => r.calculated_at > sixHoursAgo)
        .map((r) => r.fixture_id)
    );

    const toScore = matches.filter((m) => !freshSet.has(m.fixture_id));
    if (toScore.length === 0) {
      return NextResponse.json({ ok: true, message: 'All unit scores are fresh', scored: 0 });
    }

    const leagueIds = [...new Set(toScore.map((m) => m.sd_league_id).filter(Boolean))];
    let playerCache = [];
    if (leagueIds.length > 0) {
      const { data: cached } = await supabase
        .from('player_stats_cache')
        .select('*')
        .in('league_id', leagueIds)
        .gte('season', 2024)
        .order('composite_rating', { ascending: false });
      playerCache = cached || [];
    }

    const teamPlayerMap = new Map();
    for (const player of playerCache) {
      const teamId = player.raw_stats?.statistics?.[0]?.team?.id
        || player.raw_stats?.team_id
        || null;
      if (!teamId) continue;
      const key = String(teamId);
      if (!teamPlayerMap.has(key)) {
        teamPlayerMap.set(key, { attack: [], midfield: [], defence: [] });
      }
      teamPlayerMap.get(key)[classifyPosition(player.position)].push(player);
    }

    const upserts = [];
    for (const match of toScore) {
      const home = teamPlayerMap.get(String(match.home_team_id)) || { attack: [], midfield: [], defence: [] };
      const away = teamPlayerMap.get(String(match.away_team_id)) || { attack: [], midfield: [], defence: [] };

      const homeAttack   = scoreUnit(home.attack,   'attack');
      const homeMidfield = scoreUnit(home.midfield, 'midfield');
      const homeDefence  = scoreUnit(home.defence,  'defence');
      const awayAttack   = scoreUnit(away.attack,   'attack');
      const awayMidfield = scoreUnit(away.midfield, 'midfield');
      const awayDefence  = scoreUnit(away.defence,  'defence');

      const attackClashHome = calcClash(homeAttack, awayDefence);
      const attackClashAway = calcClash(awayAttack, homeDefence);
      const midfieldClash   = calcMidfieldClash(homeMidfield, awayMidfield);
      const unitTotalHome   = calcUnitTotal(attackClashHome,  midfieldClash,  homeDefence);
      const unitTotalAway   = calcUnitTotal(attackClashAway, -midfieldClash,  awayDefence);

      const topScorersHome = [...(home.attack || [])]
        .filter((p) => p.goalscorer_prob != null)
        .sort((a, b) => (b.goalscorer_prob ?? 0) - (a.goalscorer_prob ?? 0))
        .slice(0, 3)
        .map((p) => ({ player_id: p.player_id, name: p.player_name, goalscorer_prob: p.goalscorer_prob, goals: p.goals, position: p.position }));

      const topScorersAway = [...(away.attack || [])]
        .filter((p) => p.goalscorer_prob != null)
        .sort((a, b) => (b.goalscorer_prob ?? 0) - (a.goalscorer_prob ?? 0))
        .slice(0, 3)
        .map((p) => ({ player_id: p.player_id, name: p.player_name, goalscorer_prob: p.goalscorer_prob, goals: p.goals, position: p.position }));

      upserts.push({
        fixture_id:          match.fixture_id,
        home_attack_score:   homeAttack,
        home_midfield_score: homeMidfield,
        home_defence_score:  homeDefence,
        away_attack_score:   awayAttack,
        away_midfield_score: awayMidfield,
        away_defence_score:  awayDefence,
        attack_clash_home:   attackClashHome,
        attack_clash_away:   attackClashAway,
        midfield_clash:      midfieldClash,
        unit_total_home:     unitTotalHome,
        unit_total_away:     unitTotalAway,
        top_scorers_home:    topScorersHome,
        top_scorers_away:    topScorersAway,
        calculated_at:       new Date().toISOString(),
      });
    }

    const { error: upsertErr } = await supabase
      .from('unit_scores')
      .upsert(upserts, { onConflict: 'fixture_id' });
    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true, scored: upserts.length, skipped: matches.length - upserts.length });

  } catch (err) {
    console.error('[score-units] error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}