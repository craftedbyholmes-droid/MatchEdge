// MatchEdge Scoring Engine
// Uses SoccerData H2H, standings, lineups, odds and match preview data

export function calcPlayerRating(player) {
  const pos = player.position || 'M'
  const base = 55
  return base
}

// Score a match using all available SoccerData inputs
export function scoreMatch({ matchDetail, h2h, homeStanding, awayStanding, preview }) {
  let homeScore = 50
  let awayScore = 50
  const factors = {}

  // 1. League standing - position and points
  if (homeStanding && awayStanding) {
    const homePos = homeStanding.position || 10
    const awayPos = awayStanding.position || 10
    const posDiff = awayPos - homePos // positive = home team higher
    const standingAdj = Math.min(Math.max(posDiff * 1.5, -15), 15)
    homeScore += standingAdj
    awayScore -= standingAdj
    factors.standing = standingAdj

    // Points gap
    const homePts = homeStanding.points || 0
    const awayPts = awayStanding.points || 0
    const ptsAdj = Math.min(Math.max((homePts - awayPts) * 0.3, -10), 10)
    homeScore += ptsAdj
    awayScore -= ptsAdj
    factors.points = ptsAdj

    // Goals for/against ratio
    const homeGD = (homeStanding.goals_for || 0) - (homeStanding.goals_against || 0)
    const awayGD = (awayStanding.goals_for || 0) - (awayStanding.goals_against || 0)
    const gdAdj = Math.min(Math.max((homeGD - awayGD) * 0.2, -8), 8)
    homeScore += gdAdj
    awayScore -= gdAdj
    factors.goalDiff = gdAdj
  }

  // 2. H2H record
  if (h2h?.stats) {
    const overall = h2h.stats.overall
    const h2hGames = overall?.overall_games_played || 0
    if (h2hGames > 0) {
      const homeWinRate = (overall.overall_team1_wins || 0) / h2hGames
      const awayWinRate = (overall.overall_team2_wins || 0) / h2hGames
      const h2hAdj = Math.min(Math.max((homeWinRate - awayWinRate) * 20, -8), 8)
      homeScore += h2hAdj
      awayScore -= h2hAdj
      factors.h2h = h2hAdj
      const homeAtHome = h2h.stats.team1_at_home
      if (homeAtHome) {
        const homeAtHomeRate = homeAtHome.team1_games_played_at_home > 0
          ? homeAtHome.team1_wins_at_home / homeAtHome.team1_games_played_at_home : 0.5
        const homeAdvAdj = Math.min(Math.max((homeAtHomeRate - 0.4) * 10, -5), 5)
        homeScore += homeAdvAdj
        factors.homeAdvantage = homeAdvAdj
      }
    }
  }

  // 3. Home advantage baseline
  homeScore += 4
  factors.homeBase = 4

  // 4. Match preview prediction
  if (preview?.match_data?.prediction) {
    const pred = preview.match_data.prediction.choice || ''
    if (pred.toLowerCase().includes('home') || pred.toLowerCase().includes(matchDetail?.teams?.home?.name?.toLowerCase() || '')) {
      homeScore += 5
      awayScore -= 2
      factors.aiPrediction = 'home'
    } else if (pred.toLowerCase().includes('away') || pred.toLowerCase().includes(matchDetail?.teams?.away?.name?.toLowerCase() || '')) {
      awayScore += 5
      homeScore -= 2
      factors.aiPrediction = 'away'
    } else if (pred.toLowerCase().includes('draw')) {
      homeScore -= 2
      awayScore -= 2
      factors.aiPrediction = 'draw'
    }
  }

  // 5. Excitement rating from preview
  if (preview?.match_data?.excitement_rating) {
    const exc = preview.match_data.excitement_rating
    factors.excitement = exc
  }

  // 6. Sidelined players penalty
  if (matchDetail?.lineups?.sidelined) {
    const homeSidelined = matchDetail.lineups.sidelined.home?.length || 0
    const awaySidelined = matchDetail.lineups.sidelined.away?.length || 0
    const sidelinedAdj = Math.min((awaySidelined - homeSidelined) * 1.5, 8)
    homeScore += sidelinedAdj
    awayScore -= sidelinedAdj
    factors.sidelined = sidelinedAdj
  }

  // 7. Odds signal if available
  if (matchDetail?.odds?.match_winner) {
    const odds = matchDetail.odds.match_winner
    if (odds.home && odds.away) {
      const homeImplied = 1 / odds.home
      const awayImplied = 1 / odds.away
      const oddsAdj = Math.min(Math.max((homeImplied - awayImplied) * 30, -8), 8)
      homeScore += oddsAdj
      awayScore -= oddsAdj
      factors.odds = oddsAdj
    }
  }

  // Clamp to 0-100
  homeScore = Math.max(0, Math.min(100, Math.round(homeScore * 10) / 10))
  awayScore = Math.max(0, Math.min(100, Math.round(awayScore * 10) / 10))

  return {
    total_home: homeScore,
    total_away: awayScore,
    momentum_direction: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'neutral',
    momentum_strength: Math.round(Math.abs(homeScore - awayScore) * 10) / 10,
    factors
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