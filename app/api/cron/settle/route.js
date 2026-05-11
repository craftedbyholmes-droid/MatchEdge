import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export const maxDuration = 60

const FINISHED = ['FT', 'finished', 'complete', 'ended', 'after_extra_time', 'after_penalties']

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Get unsettled picks
    const { data: unsettled } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .is('outcome', null)
      .gte('pick_date', sevenDaysAgo)
      .lt('pick_date', today)

    if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0, message: 'No unsettled picks found' })

    // Get finished matches with scores
    const fixtureIds = [...new Set(unsettled.map(p => p.fixture_id))]
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, home_score, away_score, status, league')
      .in('fixture_id', fixtureIds)
      .in('status', FINISHED)

    const matchMap = {}
    for (const m of (matches || [])) matchMap[m.fixture_id] = m

    let settled = 0
    const personaTotals = {}

    for (const pick of unsettled) {
      const match = matchMap[pick.fixture_id]
      if (!match) continue

      const homeScore = match.home_score
      const awayScore = match.away_score

      // Need actual scores to settle non-anytime markets
      if (homeScore === null && pick.market !== 'anytime_scorer') continue

      const btts = homeScore > 0 && awayScore > 0
      const totalGoals = (homeScore || 0) + (awayScore || 0)
      let actualWinner = null
      if (homeScore !== null) {
        if (homeScore > awayScore) actualWinner = 'home'
        else if (awayScore > homeScore) actualWinner = 'away'
        else actualWinner = 'draw'
      }

      let outcome = 'loss'
      const sel = (pick.selection || '').toLowerCase()
      const market = pick.market || ''
      const homeName = (pick.home_team || match.home_team || '').toLowerCase()
      const awayName = (pick.away_team || match.away_team || '').toLowerCase()

      if (market === 'match_result') {
        if (actualWinner === 'home' && (sel.includes(homeName) || sel.includes('home'))) outcome = 'win'
        else if (actualWinner === 'away' && (sel.includes(awayName) || sel.includes('away'))) outcome = 'win'
        else if (actualWinner === 'draw' && sel.includes('draw')) outcome = 'win'
      } else if (market === 'btts') {
        if (sel.includes('yes') && btts) outcome = 'win'
        else if (sel.includes('no') && !btts) outcome = 'win'
      } else if (market === 'over_25') {
        if (totalGoals > 2.5) outcome = 'win'
      } else if (market === 'under_25') {
        if (totalGoals < 2.5) outcome = 'win'
      } else if (market === 'anytime_scorer') {
        outcome = 'void'
      }

      // Calculate P&L
      const stake = Number(pick.stake) || 5
      const oddsMap = {
        '1/3':1.33,'2/5':1.4,'4/9':1.44,'4/7':1.57,'8/13':1.62,'4/6':1.67,
        '8/11':1.73,'5/6':1.83,'10/11':1.91,'Evs':2.0,'11/10':2.1,'6/5':2.2,
        '5/4':2.25,'11/8':2.38,'6/4':2.5,'13/8':2.63,'7/4':2.75,'15/8':2.88,
        '2/1':3.0,'9/4':3.25,'5/2':3.5,'11/4':3.75,'3/1':4.0,'10/3':4.33,
        '7/2':4.5,'4/1':5.0,'9/2':5.5,'5/1':6.0,'6/1':7.0,'7/1':8.0,'8/1':9.0,'10/1':11.0
      }
      const dec = oddsMap[pick.odds_fractional] || Number(pick.odds_decimal) || 2.0
      let profitLoss = 0
      if (outcome === 'win') profitLoss = Math.round((stake * dec - stake) * 100) / 100
      else if (outcome === 'loss') profitLoss = -stake

      await supabaseAdmin.from('persona_picks').update({
        outcome,
        profit_loss: profitLoss,
        settled_at: new Date().toISOString(),
        home_team: pick.home_team || match.home_team,
        away_team: pick.away_team || match.away_team,
        league: pick.league || match.league
      }).eq('pick_id', pick.pick_id)

      if (!personaTotals[pick.persona]) personaTotals[pick.persona] = { wins:0, losses:0, voids:0, picks:0, staked:0, pl:0 }
      const pt = personaTotals[pick.persona]
      if (outcome !== 'void') { pt.picks++; pt.staked += stake }
      if (outcome === 'win') { pt.wins++; pt.pl += profitLoss }
      else if (outcome === 'loss') { pt.losses++; pt.pl -= stake }
      settled++
    }

    // Update persona_season
    for (const [persona, totals] of Object.entries(personaTotals)) {
      const { data: cur } = await supabaseAdmin.from('persona_season').select('*').eq('persona', persona).single()
      const c = cur || { total_picks:0, wins:0, losses:0, voids:0, total_staked:0, profit_loss:0 }
      const newPL = (Number(c.profit_loss) || 0) + totals.pl
      await supabaseAdmin.from('persona_season').upsert({
        persona,
        total_picks:  (c.total_picks  || 0) + totals.picks,
        wins:         (c.wins         || 0) + totals.wins,
        losses:       (c.losses       || 0) + totals.losses,
        voids:        (c.voids        || 0) + totals.voids,
        total_staked: (c.total_staked || 0) + totals.staked,
        profit_loss:  newPL,
        win_rate:     (c.wins + totals.wins) / Math.max(1, (c.total_picks || 0) + totals.picks),
        updated_at:   new Date().toISOString()
      }, { onConflict: 'persona' })
    }

    return NextResponse.json({ ok: true, settled, personas: personaTotals })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}