import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export const maxDuration = 60

const FINISHED_STATUSES = ['FT', 'finished', 'complete', 'ended']

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString()
    const today = new Date().toISOString().split('T')[0]

    // Get all unsettled picks from last 7 days
    const { data: unsettled } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .is('outcome', null)
      .gte('pick_date', cutoff.split('T')[0])
      .lt('pick_date', today)

    if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0, message: 'No unsettled picks' })

    // Get finished matches
    const fixtureIds = [...new Set(unsettled.map(p => p.fixture_id))]
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, home_score, away_score, status, league')
      .in('fixture_id', fixtureIds)
      .in('status', FINISHED_STATUSES)

    if (!matches?.length) return NextResponse.json({ ok: true, settled: 0, message: 'No finished matches found. Statuses: check matches table.' })

    let settled = 0
    const personaUpdates = {}

    for (const pick of unsettled) {
      const match = matches.find(m => m.fixture_id === pick.fixture_id)
      if (!match) continue

      const homeScore = match.home_score ?? null
      const awayScore = match.away_score ?? null

      // Determine actual outcome
      let actualOutcome = null
      if (homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) actualOutcome = 'home_win'
        else if (awayScore > homeScore) actualOutcome = 'away_win'
        else actualOutcome = 'draw'
      }

      const btts = homeScore > 0 && awayScore > 0
      const totalGoals = (homeScore || 0) + (awayScore || 0)

      // Determine pick outcome
      let outcome = 'loss'
      const sel = pick.selection?.toLowerCase() || ''
      const market = pick.market || ''

      if (market === 'match_result' || market === 'match_winner') {
        const favHome = pick.home_team && sel.includes(pick.home_team.toLowerCase())
        const favAway = pick.away_team && sel.includes(pick.away_team.toLowerCase())
        if (favHome && actualOutcome === 'home_win') outcome = 'win'
        else if (favAway && actualOutcome === 'away_win') outcome = 'win'
        else if (sel.includes('draw') && actualOutcome === 'draw') outcome = 'win'
      } else if (market === 'btts') {
        if (sel.includes('yes') && btts) outcome = 'win'
        else if (sel.includes('no') && !btts) outcome = 'win'
      } else if (market === 'over_25') {
        if (totalGoals > 2.5) outcome = 'win'
      } else if (market === 'under_25') {
        if (totalGoals < 2.5) outcome = 'win'
      } else if (market === 'anytime_scorer') {
        // Cannot verify without goal scorer data - mark as void for now
        outcome = 'void'
      }

      // Calculate P&L
      let profitLoss = 0
      const stake = Number(pick.stake) || 5
      const dec = Number(pick.odds_decimal) || 2.0

      if (outcome === 'win') profitLoss = Math.round((stake * dec - stake) * 100) / 100
      else if (outcome === 'loss') profitLoss = -stake
      else if (outcome === 'void') profitLoss = 0

      // Update pick
      await supabaseAdmin.from('persona_picks').update({
        outcome,
        profit_loss: profitLoss,
        settled_at: new Date().toISOString(),
        home_team: pick.home_team || match.home_team,
        away_team: pick.away_team || match.away_team,
        league: pick.league || match.league
      }).eq('pick_id', pick.pick_id)

      // Accumulate persona P&L
      if (!personaUpdates[pick.persona]) {
        personaUpdates[pick.persona] = { wins: 0, losses: 0, voids: 0, staked: 0, pl: 0, picks: 0 }
      }
      const p = personaUpdates[pick.persona]
      if (outcome !== 'void') { p.picks++; p.staked += stake }
      if (outcome === 'win') { p.wins++; p.pl += profitLoss }
      else if (outcome === 'loss') { p.losses++; p.pl += profitLoss }

      settled++
    }

    // Update persona_season
    for (const [persona, updates] of Object.entries(personaUpdates)) {
      const { data: cur } = await supabaseAdmin.from('persona_season').select('*').eq('persona', persona).single()
      const c = cur || { total_picks: 0, wins: 0, losses: 0, voids: 0, total_staked: 0, profit_loss: 0 }
      await supabaseAdmin.from('persona_season').upsert({
        persona,
        total_picks: (c.total_picks || 0) + updates.picks,
        wins:        (c.wins || 0) + updates.wins,
        losses:      (c.losses || 0) + updates.losses,
        voids:       (c.voids || 0) + updates.voids,
        total_staked: (c.total_staked || 0) + updates.staked,
        profit_loss:  (c.profit_loss || 0) + updates.pl,
        updated_at:   new Date().toISOString()
      }, { onConflict: 'persona' })
    }

    return NextResponse.json({ ok: true, settled, personas: Object.keys(personaUpdates) })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}