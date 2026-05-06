import { DEFAULT_WEIGHTS } from './engineWeights'

export function scoreMatch({ matchDetail, h2h, homeStanding, awayStanding, preview, weights }) {
  const W = weights || DEFAULT_WEIGHTS
  let homeScore = 50
  let awayScore = 50
  const factors = {}
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))
  const hasOdds = matchDetail?.odds_home_win && matchDetail?.odds_away_win
  const hasStandings = homeStanding && awayStanding
  const hasH2H = h2h?.overall?.overall_games_played > 0
  const hasPreview = preview?.has_preview && preview?.prediction
  const hasSidelined = (matchDetail?.home_sidelined?.length || 0) + (matchDetail?.away_sidelined?.length || 0) > 0

  // Normalise weights to available data
  // If a data source is missing, redistribute its weight proportionally
  let availableWeight = 0
  const activeFactors = {
    standing: hasStandings,
    h2h:      hasH2H,
    home_adv: true,
    odds:     hasOdds,
    ai_pred:  hasPreview,
    form:     hasStandings,
    sidelined:hasSidelined,
    intl_synergy: false
  }
  for (const [k, active] of Object.entries(activeFactors)) {
    if (active) availableWeight += W[k] || 0
  }
  const wScale = availableWeight > 0 ? 1 / availableWeight : 1

  // 1. League standing — position, points, goal difference
  if (hasStandings) {
    const posDiff = (awayStanding.position || 10) - (homeStanding.position || 10)
    const standAdj = clamp(posDiff * 1.8, -20, 20)
    const ptsAdj = clamp(((homeStanding.points || 0) - (awayStanding.points || 0)) * 0.4, -10, 10)
    const homeGD = (homeStanding.goals_for || 0) - (homeStanding.goals_against || 0)
    const awayGD = (awayStanding.goals_for || 0) - (awayStanding.goals_against || 0)
    const gdAdj = clamp((homeGD - awayGD) * 0.25, -8, 8)
    const rawAdj = (standAdj + ptsAdj + gdAdj) / 3
    const scaledAdj = rawAdj * (W.standing || 0) * wScale
    homeScore += scaledAdj
    awayScore -= scaledAdj
    factors.standing = Math.round(scaledAdj * 10) / 10

    // Form from games played ratio
    const homeFormPct = homeStanding.games_played > 0 ? homeStanding.wins / homeStanding.games_played : 0.33
    const awayFormPct = awayStanding.games_played > 0 ? awayStanding.wins / awayStanding.games_played : 0.33
    const formAdj = clamp((homeFormPct - awayFormPct) * 15 * (W.form || 0) * wScale, -6, 6)
    homeScore += formAdj
    awayScore -= formAdj
    factors.form = Math.round(formAdj * 10) / 10
  }

  // 2. H2H record
  if (hasH2H) {
    const overall = h2h.overall
    const games = overall.overall_games_played || 1
    const homeWR = (overall.overall_team1_wins || 0) / games
    const awayWR = (overall.overall_team2_wins || 0) / games
    const h2hAdj = clamp((homeWR - awayWR) * 20 * (W.h2h || 0) * wScale, -8, 8)
    // Home advantage within H2H
    const homeRec = h2h.home_record
    const homeAdvAdj = homeRec && homeRec.team1_games_played_at_home > 0
      ? clamp(((homeRec.team1_wins_at_home / homeRec.team1_games_played_at_home) - 0.4) * 8, -4, 4)
      : 0
    const total = h2hAdj + homeAdvAdj
    homeScore += total
    awayScore -= total
    factors.h2h = Math.round(total * 10) / 10
  }

  // 3. Home advantage — always applied
  const homeAdvBase = 4 * (W.home_adv || 0.1) * wScale
  homeScore += homeAdvBase
  factors.home_adv = Math.round(homeAdvBase * 10) / 10

  // 4. Bookmaker odds signal
  if (hasOdds) {
    const homeImpl = 1 / matchDetail.odds_home_win
    const awayImpl = 1 / matchDetail.odds_away_win
    const drawImpl = matchDetail.odds_draw ? 1 / matchDetail.odds_draw : 0
    const total = homeImpl + awayImpl + drawImpl || 1
    const homeNorm = homeImpl / total
    const awayNorm = awayImpl / total
    const oddsAdj = clamp((homeNorm - awayNorm) * 35 * (W.odds || 0) * wScale, -12, 12)
    homeScore += oddsAdj
    awayScore -= oddsAdj
    factors.odds = Math.round(oddsAdj * 10) / 10
  }

  // 5. AI prediction signal
  if (hasPreview) {
    const pred = (preview.prediction?.choice || '').toLowerCase()
    const homeName = (matchDetail.home_team?.name || '').toLowerCase()
    const awayName = (matchDetail.away_team?.name || '').toLowerCase()
    const adjMag = 5 * (W.ai_pred || 0.1) * wScale
    if (pred.includes('home') || (homeName && pred.includes(homeName))) {
      homeScore += adjMag; awayScore -= adjMag * 0.5
      factors.ai_pred = Math.round(adjMag * 10) / 10
    } else if (pred.includes('away') || (awayName && pred.includes(awayName))) {
      awayScore += adjMag; homeScore -= adjMag * 0.5
      factors.ai_pred = Math.round(-adjMag * 10) / 10
    } else {
      factors.ai_pred = 0
    }
  }

  // 6. Sidelined impact
  if (hasSidelined) {
    const homeSL = (matchDetail.home_sidelined || []).filter(p => p.status === 'out').length
    const awaySL = (matchDetail.away_sidelined || []).filter(p => p.status === 'out').length
    const homeDoubtful = (matchDetail.home_sidelined || []).filter(p => p.status === 'questionable').length
    const awayDoubtful = (matchDetail.away_sidelined || []).filter(p => p.status === 'questionable').length
    const homeImpact = homeSL * 1.5 + homeDoubtful * 0.5
    const awayImpact = awaySL * 1.5 + awayDoubtful * 0.5
    const slAdj = clamp((awayImpact - homeImpact) * (W.sidelined || 0.05) * wScale * 10, -8, 8)
    homeScore += slAdj
    awayScore -= slAdj
    factors.sidelined = Math.round(slAdj * 10) / 10
    factors.home_sidelined_count = homeSL
    factors.away_sidelined_count = awaySL
  }

  // Clamp final scores 0-100
  homeScore = Math.max(20, Math.min(100, Math.round(homeScore * 10) / 10))
  awayScore = Math.max(20, Math.min(100, Math.round(awayScore * 10) / 10))

  // Data quality indicator — how much real data powered this score
  const dataQuality = [hasStandings, hasH2H, hasOdds, hasPreview].filter(Boolean).length

  return {
    total_home: homeScore,
    total_away: awayScore,
    momentum_direction: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'neutral',
    momentum_strength: Math.round(Math.abs(homeScore - awayScore) * 10) / 10,
    data_quality: dataQuality,
    factors,
    weights_used: W
  }
}

const FORMATION_ZONES = {
  '4-3-3':   { def: 4, mid: 2, wide: 4 },
  '4-2-3-1': { def: 5, mid: 2, wide: 3 },
  '4-4-2':   { def: 4, mid: 2, wide: 4 },
  '3-5-2':   { def: 3, mid: 3, wide: 4 },
  '5-3-2':   { def: 5, mid: 3, wide: 2 },
  '3-4-3':   { def: 3, mid: 2, wide: 6 }
}

export function calcFormationWeights(homeFormation, awayFormation) {
  const hf = FORMATION_ZONES[homeFormation] || { def: 4, mid: 2, wide: 4 }
  const af = FORMATION_ZONES[awayFormation] || { def: 4, mid: 2, wide: 4 }
  const cl = (v, mn, mx) => Math.max(mn, Math.min(mx, v))
  const ca = cl(-(hf.mid - af.mid) * 0.045, -0.14, 0.14)
  const wa = cl(-(hf.wide - af.wide) * 0.045, -0.14, 0.14)
  let cW = 0.55 + ca, wW = 0.30 + wa, sW = 0.15 - (ca + wa)
  if (cW < 0.08) { sW += cW - 0.08; cW = 0.08 }
  if (wW < 0.08) { sW += wW - 0.08; wW = 0.08 }
  if (sW < 0.08) { cW += sW - 0.08; sW = 0.08 }
  return { central: Math.round(cW * 100) / 100, wide: Math.round(wW * 100) / 100, setpiece: Math.round(sW * 100) / 100 }
}

export function calcMatchTempo(homePPDA, awayPPDA) {
  const cl = (v, mn, mx) => Math.max(mn, Math.min(mx, v))
  const hPI = cl((12 - (homePPDA || 9)) / 6, 0, 1)
  const aPI = cl((12 - (awayPPDA || 9)) / 6, 0, 1)
  const tempo = (hPI + aPI) / 2
  return { tempo, homePressIntensity: hPI, awayPressIntensity: aPI, xGMultiplier: 1.0 + (tempo - 0.5) * 0.20 }
}