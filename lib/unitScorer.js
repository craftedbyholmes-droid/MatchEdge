import { calcPlayerRating, calcGoalscorerProb, afFetch, AF_LEAGUE_IDS } from '@/lib/apiFootball'
import supabaseAdmin from '@/lib/supabase'

// Fetch and cache player stats from API Football
// Uses fixture endpoint - 1 call gets all 22 players
export async function fetchAndCacheFixtureStats(fixtureId, afFixtureId, leagueName) {
  if (!afFixtureId) return null

  // Check cache - if fetched in last 6 hours dont re-fetch
  const { data: cached } = await supabaseAdmin
    .from('player_stats_cache')
    .select('player_id, composite_rating, goalscorer_prob, fetched_at')
    .eq('league_id', AF_LEAGUE_IDS[leagueName] || 39)
    .gte('fetched_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .limit(1)

  if (cached?.length) return { cached: true }

  try {
    const data = await afFetch('/fixtures/players?fixture=' + afFixtureId)
    const teams = data?.response || []
    const season = new Date().getFullYear()

    for (const team of teams) {
      for (const player of (team.players || [])) {
        const s = player.statistics?.[0]
        if (!s) continue

        const pos = s.games?.position || ''
        const rating = calcPlayerRating(s, pos)
        const gsProb = calcGoalscorerProb(s, pos)

        await supabaseAdmin.from('player_stats_cache').upsert({
          player_id:        player.player?.id || 0,
          af_player_id:     player.player?.id,
          player_name:      player.player?.name,
          season,
          position:         pos,
          rating:           parseFloat(s.games?.rating) || null,
          appearances:      s.games?.appearences || 0,
          minutes:          s.games?.minutes || 0,
          goals:            s.goals?.total || 0,
          assists:          s.goals?.assists || 0,
          shots_total:      s.shots?.total || 0,
          shots_on:         s.shots?.on || 0,
          key_passes:       s.passes?.key || 0,
          duels_total:      s.duels?.total || 0,
          duels_won:        s.duels?.won || 0,
          dribbles_att:     s.dribbles?.attempts || 0,
          dribbles_succ:    s.dribbles?.success || 0,
          tackles:          s.tackles?.total || 0,
          interceptions:    s.tackles?.interceptions || 0,
          blocks:           s.tackles?.blocks || 0,
          yellow_cards:     s.cards?.yellow || 0,
          red_cards:        s.cards?.red || 0,
          composite_rating: rating,
          goalscorer_prob:  gsProb,
          raw_stats:        s,
          fetched_at:       new Date().toISOString()
        }, { onConflict: 'player_id,season' })
      }
    }
    return { fetched: true, players: teams.reduce((s, t) => s + t.players.length, 0) }
  } catch(err) {
    console.error('fetchAndCacheFixtureStats error:', err.message)
    return null
  }
}

// Get player rating from cache, fallback to position average
async function getPlayerRating(playerName, position, sdPlayerId) {
  if (!playerName) return getPositionAverage(position)

  // Try exact name match first
  const { data } = await supabaseAdmin
    .from('player_stats_cache')
    .select('composite_rating, goalscorer_prob, goals, assists, shots_total, shots_on')
    .ilike('player_name', playerName.replace(/^[A-Z]\\.\\s/, '%'))
    .order('fetched_at', { ascending: false })
    .limit(1)

  if (data?.[0]?.composite_rating) return data[0]
  return { composite_rating: getPositionAverage(position), goalscorer_prob: getPositionGSProb(position) }
}

function getPositionAverage(position) {
  const pos = (position || '').toLowerCase()
  if (pos.includes('goal')) return 6.4
  if (pos.includes('def'))  return 6.3
  if (pos.includes('mid'))  return 6.5
  if (pos.includes('att') || pos.includes('for')) return 6.6
  return 6.4
}

function getPositionGSProb(position) {
  const pos = (position || '').toLowerCase()
  if (pos.includes('goal')) return 0.005
  if (pos.includes('def'))  return 0.03
  if (pos.includes('mid'))  return 0.07
  if (pos.includes('att') || pos.includes('for')) return 0.18
  return 0.05
}

// Score a unit of players
async function scoreUnit(players, unitType) {
  if (!players?.length) return { score: 50, players: [], avgRating: 6.5 }

  const ratings = []
  const enriched = []

  for (const p of players) {
    const name = p.player?.name || p.name || ''
    const pos  = p.position || ''
    const data = await getPlayerRating(name, pos, p.player?.id)
    const rating = data.composite_rating || getPositionAverage(pos)
    const gsProb = data.goalscorer_prob || getPositionGSProb(pos)
    ratings.push(rating)
    enriched.push({ ...p, rating, gsProb, goals: data.goals, assists: data.assists })
  }

  const avgRating = ratings.reduce((s, r) => s + r, 0) / ratings.length
  const maxRating = Math.max(...ratings)

  // Unit score: average quality + star player bonus + depth bonus
  const starBonus   = maxRating > 8.0 ? (maxRating - 8.0) * 5 : 0
  const depthBonus  = players.length >= 4 ? 3 : players.length >= 3 ? 1.5 : 0
  const unitScore   = (avgRating - 5) * 10 + starBonus + depthBonus

  return {
    score:     Math.max(0, Math.min(100, 50 + unitScore)),
    avgRating: Math.round(avgRating * 100) / 100,
    maxRating: Math.round(maxRating * 100) / 100,
    players:   enriched.sort((a, b) => b.rating - a.rating)
  }
}

// Main unit interaction scorer
export async function scoreUnitInteractions(fixtureId, homeLineup, awayLineup) {
  if (!homeLineup?.length && !awayLineup?.length) return null

  function getUnit(lineup, posKeywords) {
    return (lineup || []).filter(p => posKeywords.some(k => (p.position || '').toLowerCase().includes(k)))
  }

  const homeAtt  = getUnit(homeLineup, ['attacker', 'forward', 'striker'])
  const homeMid  = getUnit(homeLineup, ['midfielder'])
  const homeDef  = getUnit(homeLineup, ['defender'])
  const homeGK   = getUnit(homeLineup, ['goalkeeper'])
  const awayAtt  = getUnit(awayLineup, ['attacker', 'forward', 'striker'])
  const awayMid  = getUnit(awayLineup, ['midfielder'])
  const awayDef  = getUnit(awayLineup, ['defender'])
  const awayGK   = getUnit(awayLineup, ['goalkeeper'])

  // Score all units in parallel
  const [hAttScore, hMidScore, hDefScore, hGKScore,
         aAttScore, aMidScore, aDefScore, aGKScore] = await Promise.all([
    scoreUnit(homeAtt, 'attack'),
    scoreUnit(homeMid, 'midfield'),
    scoreUnit(homeDef, 'defence'),
    scoreUnit(homeGK,  'goalkeeper'),
    scoreUnit(awayAtt, 'attack'),
    scoreUnit(awayMid, 'midfield'),
    scoreUnit(awayDef, 'defence'),
    scoreUnit(awayGK,  'goalkeeper')
  ])

  // CROSS-UNIT CLASH SCORES
  // Home attack vs Away defence (can home break through?)
  const homeAttackClash = Math.max(0, Math.min(100,
    50 + (hAttScore.score - aDefScore.score) * 0.4 + (hAttScore.score - aGKScore.score) * 0.1
  ))

  // Away attack vs Home defence (can away break through?)
  const awayAttackClash = Math.max(0, Math.min(100,
    50 + (aAttScore.score - hDefScore.score) * 0.4 + (aAttScore.score - hGKScore.score) * 0.1
  ))

  // Midfield battle (who controls the game?)
  const midfieldClash = Math.max(0, Math.min(100,
    50 + (hMidScore.score - aMidScore.score) * 0.5
  ))

  // Overall unit total scores
  const unitTotalHome = (
    homeAttackClash * 0.35 +
    midfieldClash   * 0.30 +
    (100 - awayAttackClash) * 0.25 +
    hGKScore.score  * 0.10
  )

  const unitTotalAway = (
    awayAttackClash * 0.35 +
    (100 - midfieldClash) * 0.30 +
    (100 - homeAttackClash) * 0.25 +
    aGKScore.score  * 0.10
  )

  // Top goalscorer candidates
  const topScorersHome = hAttScore.players
    .concat(hMidScore.players.filter(p => (p.gsProb || 0) > 0.08))
    .sort((a, b) => (b.gsProb || 0) - (a.gsProb || 0))
    .slice(0, 3)
    .map(p => ({ name: p.player?.name || p.name, prob: Math.round((p.gsProb || 0) * 100), rating: p.rating }))

  const topScorersAway = aAttScore.players
    .concat(aMidScore.players.filter(p => (p.gsProb || 0) > 0.08))
    .sort((a, b) => (b.gsProb || 0) - (a.gsProb || 0))
    .slice(0, 3)
    .map(p => ({ name: p.player?.name || p.name, prob: Math.round((p.gsProb || 0) * 100), rating: p.rating }))

  const result = {
    home_attack_score:   Math.round(hAttScore.score),
    home_midfield_score: Math.round(hMidScore.score),
    home_defence_score:  Math.round(hDefScore.score),
    away_attack_score:   Math.round(aAttScore.score),
    away_midfield_score: Math.round(aMidScore.score),
    away_defence_score:  Math.round(aDefScore.score),
    attack_clash_home:   Math.round(homeAttackClash),
    attack_clash_away:   Math.round(awayAttackClash),
    midfield_clash:      Math.round(midfieldClash),
    unit_total_home:     Math.round(unitTotalHome),
    unit_total_away:     Math.round(unitTotalAway),
    top_scorers_home:    topScorersHome,
    top_scorers_away:    topScorersAway,
    units: {
      home: { attack: hAttScore, midfield: hMidScore, defence: hDefScore, gk: hGKScore },
      away: { attack: aAttScore, midfield: aMidScore, defence: aDefScore, gk: aGKScore }
    }
  }

  // Cache in DB
  await supabaseAdmin.from('unit_scores').upsert({
    fixture_id: fixtureId,
    ...result,
    top_scorers_home: topScorersHome,
    top_scorers_away: topScorersAway,
    calculated_at: new Date().toISOString()
  }, { onConflict: 'fixture_id' })

  return result
}