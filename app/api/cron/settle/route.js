import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export const maxDuration = 60
const FINISHED = ['FT', 'finished', 'complete', 'ended']

// Convert fractional odds string to decimal
function fracToDec(frac) {
  const map = {
    '1/3':1.33,'2/5':1.4,'4/9':1.44,'4/7':1.57,'8/13':1.62,'4/6':1.67,
    '8/11':1.73,'5/6':1.83,'10/11':1.91,'Evs':2.0,'11/10':2.1,'6/5':2.2,
    '5/4':2.25,'11/8':2.38,'6/4':2.5,'13/8':2.63,'7/4':2.75,'15/8':2.88,
    '2/1':3.0,'9/4':3.25,'5/2':3.5,'11/4':3.75,'3/1':4.0,'7/2':4.5,
    '4/1':5.0,'9/2':5.5,'5/1':6.0,'6/1':7.0,'7/1':8.0,'8/1':9.0,'10/1':11.0,
    '1/2':1.5,'4/11':1.36,'2/7':1.29,'1/4':1.25,'2/9':1.22,'1/5':1.2
  }
  if (map[frac]) return map[frac]
  const parts = frac?.split('/')
  if (parts?.length === 2) return (parseInt(parts[0]) / parseInt(parts[1])) + 1
  return 2.0
}

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Only settle gordon and stan - pez needs event data we don't have yet
    const { data: unsettled } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .is('outcome', null)
      .in('persona', ['gordon', 'stan'])
      .gte('pick_date', sevenDaysAgo)
      .lt('pick_date', today)

    if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0, message: 'No unsettled picks' })

    const fixtureIds = [...new Set(unsettled.map(p => p.fixture_id))]
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, home_score, away_score, status, league')
      .in('fixture_id', fixtureIds)
      .in('status', FINISHED)
      .not('home_score', 'is', null)

    if (!matches?.length) return NextResponse.json({ ok: true, settled: 0, message: 'No finished matches with scores' })

    const matchMap = {}
    for (const m of matches) matchMap[m.fixture_id] = m

    let settled = 0
    const personaTotals = {}

    for (const pick of unsettled) {
      const match = matchMap[pick.fixture_id]
      if (!match) continue

      const homeScore = Number(match.home_score)
      const awayScore = Number(match.away_score)
      const btts = homeScore > 0 && awayScore > 0
      const totalGoals = homeScore + awayScore

      // Actual result
      let actual = 'draw'
      if (homeScore > awayScore) actual = 'home'
      else if (awayScore > homeScore) actual = 'away'

      let outcome = 'loss'
      const market = pick.market || ''
      const sel = (pick.selection || '').toLowerCase().trim()
      const home = (pick.home_team || match.home_team || '').toLowerCase().trim()
      const away = (pick.away_team || match.away_team || '').toLowerCase().trim()

      if (market === 'match_result') {
        // Check if selection contains home team name or away team name
        const selHome = home.split(' ').some(w => w.length > 3 && sel.includes(w))
        const selAway = away.split(' ').some(w => w.length > 3 && sel.includes(w))
        if (selHome && actual === 'home') outcome = 'win'
        else if (selAway && actual === 'away') outcome = 'win'
        else if (sel.includes('draw') && actual === 'draw') outcome = 'win'
      } else if (market === 'btts') {
        if (sel.includes('yes') && btts) outcome = 'win'
        else if (sel.includes('no') && !btts) outcome = 'win'
      } else if (market === 'over_25') {
        if (totalGoals > 2.5) outcome = 'win'
      } else if (market === 'under_25') {
        if (totalGoals < 2.5) outcome = 'win'
      }

      const stake = Number(pick.stake) || 5
      const dec = fracToDec(pick.odds_fractional)
      const profitLoss = outcome === 'win'
        ? Math.round((stake * dec - stake) * 100) / 100
        : -stake

      await supabaseAdmin.from('persona_picks').update({
        outcome,
        profit_loss: profitLoss,
        settled_at: new Date().toISOString(),
        home_team: pick.home_team || match.home_team,
        away_team: pick.away_team || match.away_team,
        league: pick.league || match.league
      }).eq('pick_id', pick.pick_id)

      if (!personaTotals[pick.persona])
        personaTotals[pick.persona] = { wins:0, losses:0, picks:0, staked:0, pl:0 }
      const pt = personaTotals[pick.persona]
      pt.picks++; pt.staked += stake
      if (outcome === 'win') { pt.wins++; pt.pl += profitLoss }
      else { pt.losses++; pt.pl -= stake }
      settled++
    }

    // Update persona_season
    for (const [persona, t] of Object.entries(personaTotals)) {
      const { data: cur } = await supabaseAdmin.from('persona_season').select('*').eq('persona', persona).single()
      const c = cur || { total_picks:0, wins:0, losses:0, voids:0, total_staked:0, profit_loss:0 }
      const newPL = Number(c.profit_loss || 0) + t.pl
      const newPicks = (c.total_picks || 0) + t.picks
      const newWins = (c.wins || 0) + t.wins
      await supabaseAdmin.from('persona_season').upsert({
        persona,
        total_picks:  newPicks,
        wins:         newWins,
        losses:       (c.losses || 0) + t.losses,
        total_staked: Number(c.total_staked || 0) + t.staked,
        profit_loss:  Math.round(newPL * 100) / 100,
        win_rate:     newPicks > 0 ? Math.round(newWins / newPicks * 100) / 100 : 0,
        roi:          t.staked > 0 ? Math.round((newPL / (Number(c.total_staked||0) + t.staked)) * 100) / 100 : 0,
        updated_at:   new Date().toISOString()
      }, { onConflict: 'persona' })
    }

    return NextResponse.json({ ok: true, settled, personas: personaTotals })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}