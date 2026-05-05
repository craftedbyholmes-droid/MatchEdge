import { DEFAULT_WEIGHTS } from './engineWeights'

export function calcPlayerRating(player) {
  const pos = player.position || 'M'
  return 55
}

// Main scoring function - uses dynamic weights per league
export function scoreMatch({ matchDetail, h2h, homeStanding, awayStanding, preview, weights, intlProfiles }) {
  const W = weights || DEFAULT_WEIGHTS
  let homeScore = 50
  let awayScore = 50
  const factors = {}
  const maxAdj = 20
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))

  // 1. League standing
  if (homeStanding && awayStanding) {
    const posDiff = (awayStanding.position || 10) - (homeStanding.position || 10)
    const standingAdj = clamp(posDiff * 1.5, -maxAdj, maxAdj)
    const ptsAdj = clamp(((homeStanding.points || 0) - (awayStanding.points || 0)) * 0.3, -10, 10)
    const homeGD = (homeStanding.goals_for || 0) - (homeStanding.goals_against || 0)
    const awayGD = (awayStanding.goals_for || 0) - (awayStanding.goals_against || 0)
    const gdAdj = clamp((homeGD - awayGD) * 0.2, -8, 8)
    const totalAdj = (standingAdj + ptsAdj + gdAdj) * (W.standing / DEFAULT_WEIGHTS.standing)
    homeScore += totalAdj
    awayScore -= totalAdj
    factors.standing = Math.round(totalAdj * 10) / 10
  }

  // 2. H2H record
  if (h2h?.stats?.overall) {
    const overall = h2h.stats.overall
    const games = overall.overall_games_played || 0
    if (games > 0) {
      const homeWR = (overall.overall_team1_wins || 0) / games
      const awayWR = (overall.overall_team2_wins || 0) / games
      const h2hAdj = clamp((homeWR - awayWR) * 20 * (W.h2h / DEFAULT_WEIGHTS.h2h), -8, 8)
      const homeAtHome = h2h.stats.team1_at_home
      const homeAdvAdj = homeAtHome && homeAtHome.team1_games_played_at_home > 0
        ? clamp(((homeAtHome.team1_wins_at_home / homeAtHome.team1_games_played_at_home) - 0.4) * 10, -5, 5)
        : 0
      homeScore += h2hAdj + homeAdvAdj
      awayScore -= h2hAdj + homeAdvAdj
      factors.h2h = Math.round((h2hAdj + homeAdvAdj) * 10) / 10
    }
  }

  // 3. Home advantage
  const homeAdvBase = 4 * (W.home_adv / DEFAULT_WEIGHTS.home_adv)
  homeScore += homeAdvBase
  factors.home_adv = Math.round(homeAdvBase * 10) / 10

  // 4. AI prediction signal
  if (preview?.match_data?.prediction) {
    const pred = preview.match_data.prediction.choice?.toLowerCase() || ''
    const adjMag = 5 * (W.ai_pred / DEFAULT_WEIGHTS.ai_pred)
    const homeName = (matchDetail?.teams?.home?.name || '').toLowerCase()
    const awayName = (matchDetail?.teams?.away?.name || '').toLowerCase()
    if (pred.includes('home') || (homeName && pred.includes(homeName))) {
      homeScore += adjMag; awayScore -= adjMag * 0.4
      factors.ai_pred = adjMag
    } else if (pred.includes('away') || (awayName && pred.includes(awayName))) {
      awayScore += adjMag; homeScore -= adjMag * 0.4
      factors.ai_pred = -adjMag
    } else if (pred.includes('draw')) {
      homeScore -= adjMag * 0.4; awayScore -= adjMag * 0.4
      factors.ai_pred = 0
    }
  }

  // 5. Excitement / form signal
  if (preview?.match_data?.excitement_rating) {
    const exc = preview.match_data.excitement_rating
    factors.excitement = exc
  }

  // 6. Sidelined players
  if (matchDetail?.lineups?.sidelined) {
    const homeSL = matchDetail.lineups.sidelined.home?.length || 0
    const awaySL = matchDetail.lineups.sidelined.away?.length || 0
    const slAdj = clamp((awaySL - homeSL) * 1.5 * (W.sidelined / DEFAULT_WEIGHTS.sidelined), -8, 8)
    homeScore += slAdj
    awayScore -= slAdj
    factors.sidelined = Math.round(slAdj * 10) / 10
  }

  // 7. Odds signal
  if (matchDetail?.odds?.match_winner) {
    const odds = matchDetail.odds.match_winner
    if (odds.home && odds.away) {
      const homeImpl = 1 / odds.home
      const awayImpl = 1 / odds.away
      const oddsAdj = clamp((homeImpl - awayImpl) * 30 * (W.odds / DEFAULT_WEIGHTS.odds), -10, 10)
      homeScore += oddsAdj
      awayScore -= oddsAdj
      factors.odds = Math.round(oddsAdj * 10) / 10
    }
  }

  // 8. International player synergy bonus
  if (intlProfiles && intlProfiles.length > 0 && W.intl_synergy > 0) {
    const avgBoost = intlProfiles.reduce((sum, p) => sum + ((p.intl_club_ratio || 1) - 1), 0) / intlProfiles.length
    const intlAdj = clamp(avgBoost * 10 * (W.intl_synergy / DEFAULT_WEIGHTS.intl_synergy), -6, 6)
    homeScore += intlAdj
    factors.intl_synergy = Math.round(intlAdj * 10) / 10
  }

  homeScore = Math.max(0, Math.min(100, Math.round(homeScore * 10) / 10))
  awayScore = Math.max(0, Math.min(100, Math.round(awayScore * 10) / 10))

  return {
    total_home: homeScore,
    total_away: awayScore,
    momentum_direction: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'neutral',
    momentum_strength: Math.round(Math.abs(homeScore - awayScore) * 10) / 10,
    factors,
    weights_used: W
  }
}

const FORMATION_ZONES = {
  '4-3-3':   { def: 4, mid: 2, wide: 4 },
  '4-2-3-1': { def: 5, mid: 2, wide: 3 },
  '4-4-2':   { def: 4, mid: 2, wide: 4 },
  '3-5-2':   { def: 3, mid: 3, wide: 4 },
  '5-3-2':   { def: 5, mid: 3, wide: 2 }
}

export function calcFormationWeights(h, a) {
  const hf = FORMATION_ZONES[h] || { def: 4, mid: 2, wide: 4 }
  const af = FORMATION_ZONES[a] || { def: 4, mid: 2, wide: 4 }
  const cl = (v,mn,mx) => Math.max(mn, Math.min(mx, v))
  const ca = cl(-(hf.mid - af.mid) * 0.045, -0.14, 0.14)
  const wa = cl(-(hf.wide - af.wide) * 0.045, -0.14, 0.14)
  let cW = 0.55 + ca, wW = 0.30 + wa, sW = 0.15 - (ca + wa)
  if (cW < 0.08) { sW -= (0.08 - cW); cW = 0.08 }
  if (wW < 0.08) { sW -= (0.08 - wW); wW = 0.08 }
  if (sW < 0.08) { cW -= (0.08 - sW); sW = 0.08 }
  return { central: Math.round(cW * 100) / 100, wide: Math.round(wW * 100) / 100, setpiece: Math.round(sW * 100) / 100 }
}

export function calcMatchTempo(homePPDA, awayPPDA) {
  const cl = (v,mn,mx) => Math.max(mn, Math.min(mx, v))
  const hPI = cl((12 - (homePPDA || 9)) / 6, 0, 1)
  const aPI = cl((12 - (awayPPDA || 9)) / 6, 0, 1)
  const tempo = (hPI + aPI) / 2
  return { tempo, homePressIntensity: hPI, awayPressIntensity: aPI, xGMultiplier: 1.0 + (tempo - 0.5) * 0.20 }
}