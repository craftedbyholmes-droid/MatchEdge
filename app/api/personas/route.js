import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const PERSONAS = {
  gordon: { name: 'Gaffer Gordon', market: 'match_result', min_gap: 12, max_picks: 4, min_picks: 2, best_stake: 15, std_stake: 5,
    voice: 'You are Gaffer Gordon, an ex-football manager. Authoritative, tactical, northern. Write a punchy 1-sentence tip for why this team wins. Max 100 chars. No hashtags.' },
  stan:   { name: 'Stats Stan',    market: 'btts',         min_gap: 0,  max_picks: 4, min_picks: 2, best_stake: 10, std_stake: 5,
    voice: 'You are Stats Stan, a data obsessive. Quick-fire, analytical. Write a 1-sentence BTTS tip based on both teams attacking scores. Max 100 chars. No hashtags.' },
  pez:    { name: 'Punter Pez',    market: 'anytime_scorer', min_gap: 0, max_picks: 4, min_picks: 2, best_stake: 10, std_stake: 5,
    voice: 'You are Punter Pez, enthusiastic London/Essex punter. Write a 1-sentence player prop tip naming the player and why they will score. Max 100 chars. No hashtags.' }
}

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const now = new Date()
    const horizon = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString()
    const nowISO = now.toISOString()

    const { data: allMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, sd_league_id')
      .in('status', ['scheduled', 'pre-match'])
      .gte('kickoff_time', nowISO)
      .lte('kickoff_time', horizon)
      .order('kickoff_time', { ascending: true })

    if (!allMatches?.length) return NextResponse.json({ ok: true, picks: 0, message: 'No fixtures in next 72 hours' })

    const firstMatchDate = allMatches[0].kickoff_time.split('T')[0]
    const nextMatchdayFixtures = allMatches.filter(m => m.kickoff_time.split('T')[0] === firstMatchDate)
    const fixtureIds = nextMatchdayFixtures.map(m => m.fixture_id)

    const { data: allScores } = await supabaseAdmin
      .from('match_scores')
      .select('fixture_id, total_home, total_away, score_state, modifiers')
      .in('fixture_id', fixtureIds)
      .order('score_state', { ascending: false })

    // Keep highest score_state per fixture
    const bestScores = {}
    for (const score of (allScores || [])) {
      if (!bestScores[score.fixture_id] || score.score_state > bestScores[score.fixture_id].score_state) {
        bestScores[score.fixture_id] = score
      }
    }

    const matches = nextMatchdayFixtures
      .map(m => ({ ...m, score: bestScores[m.fixture_id] || null }))
      .filter(m => m.score)

    if (!matches.length) return NextResponse.json({ ok: true, picks: 0, message: 'No scored fixtures for ' + firstMatchDate })

    await supabaseAdmin.from('persona_picks').delete().eq('pick_date', firstMatchDate)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    let totalPicks = 0
    const errors = []

    for (const [personaId, persona] of Object.entries(PERSONAS)) {
      const candidates = matches.map(m => {
        const homeScore = m.score.total_home
        const awayScore = m.score.total_away
        const gap = Math.abs(homeScore - awayScore)
        const topScore = Math.max(homeScore, awayScore)
        const combined = homeScore + awayScore
        const isFavHome = homeScore >= awayScore
        const favourite = isFavHome ? m.home_team : m.away_team
        let qualifies = false, selection = '', market = persona.market
        let sortKey = 0

        if (personaId === 'gordon') {
          qualifies = gap >= persona.min_gap
          selection = favourite + ' Win'
          sortKey = gap // sort by biggest gap
        } else if (personaId === 'stan') {
          qualifies = combined > 100
          selection = combined > 110 ? 'Over 2.5 Goals' : 'BTTS Yes'
          market = combined > 110 ? 'over_25' : 'btts'
          sortKey = combined // sort by highest combined score
        } else if (personaId === 'pez') {
          const lineup = isFavHome ? (m.score.modifiers?.home_lineup || []) : (m.score.modifiers?.away_lineup || [])
          const attackers = lineup.filter(p => p.position === 'Attacker')
          qualifies = attackers.length > 0
          selection = attackers[0]?.player?.name ? attackers[0].player.name + ' Anytime Scorer' : favourite + ' Scorer'
          market = 'anytime_scorer'
          sortKey = topScore // sort by highest engine score
        }

        if (!qualifies) return null
        return { match: m, gap, topScore, combined, favourite, selection, market, homeScore, awayScore, isFavHome, sortKey }
      }).filter(Boolean)

      if (candidates.length < persona.min_picks) continue

      // Sort by the right key for each persona
      candidates.sort((a, b) => b.sortKey - a.sortKey)

      // Cap at max 4
      const picks = candidates.slice(0, persona.max_picks)

      for (let i = 0; i < picks.length; i++) {
        const pick = picks[i]
        const m = pick.match
        const isBest = i === 0
        const stake = isBest ? persona.best_stake : persona.std_stake

        // Real odds
        const odds = m.score.modifiers?.odds
        let oddsDecimal = 1.9
        if (personaId === 'gordon' && odds?.match_winner) {
          oddsDecimal = pick.isFavHome ? (odds.match_winner.home || 1.9) : (odds.match_winner.away || 1.9)
        } else if (personaId === 'stan' && odds?.over_under) {
          oddsDecimal = odds.over_under.over || 1.85
        }
        const oddsFractional = decToFrac(oddsDecimal)

        // AI tip
        let tipText = ''
        try {
          const prompt = m.home_team + ' vs ' + m.away_team + ' (' + m.league + '). Engine: Home ' + Math.round(pick.homeScore) + ' vs Away ' + Math.round(pick.awayScore) + '. Pick: ' + pick.selection + '. Gap: ' + Math.round(pick.gap) + 'pts.'
          const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514', max_tokens: 80,
            system: persona.voice,
            messages: [{ role: 'user', content: prompt }]
          })
          tipText = msg.content[0]?.text || ''
        } catch(err) { console.error('AI tip error:', err.message) }

        const pickRow = {
          pick_id:         personaId + '_' + m.fixture_id + '_' + i + '_' + firstMatchDate,
          persona:         personaId,
          fixture_id:      m.fixture_id,
          market:          pick.market,
          selection:       pick.selection,
          odds_fractional: oddsFractional,
          odds_decimal:    oddsDecimal,
          engine_score:    Math.round(pick.topScore),
          score_gap:       Math.round(pick.gap),
          is_best_pick:    isBest,
          stake:           stake,
          tip_text:        tipText,
          pick_date:       firstMatchDate,
          outcome:         null,
          profit_loss:     0
        }

        const { error } = await supabaseAdmin.from('persona_picks').insert(pickRow)
        if (error) { console.error('Pick insert error:', error.message); errors.push(error.message) }
        else totalPicks++
      }
    }

    return NextResponse.json({ ok: true, picks: totalPicks, errors: errors.length, matchday: firstMatchDate, fixtures_scored: matches.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.4) return '1/3'
  if (n < 0.55) return '4/7'
  if (n < 0.7) return '4/6'
  if (n < 0.85) return '5/6'
  if (n < 1.05) return 'Evs'
  if (n < 1.2) return '11/10'
  if (n < 1.4) return '6/5'
  if (n < 1.6) return '6/4'
  if (n < 1.85) return '7/4'
  if (n < 2.1) return '2/1'
  if (n < 2.4) return '9/4'
  if (n < 2.7) return '5/2'
  if (n < 3.1) return '3/1'
  if (n < 3.6) return '7/2'
  if (n < 4.1) return '4/1'
  return Math.round(n) + '/1'
}