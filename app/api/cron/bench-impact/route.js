import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchLineup } from '@/lib/footballApi'
import { calcBenchImpacts } from '@/lib/benchImpact'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('fixture_id, home_team, away_team').eq('score_state', 4)
    if (!matches?.length) return NextResponse.json({ ok: true, processed: 0 })
    let processed = 0
    for (const match of matches) {
      const lineups = await fetchLineup(match.fixture_id)
      for (const lineup of lineups) {
        const team = lineup.team?.name === match.home_team ? 'home' : 'away'
        const impacts = calcBenchImpacts(lineup, team)
        for (const imp of impacts) {
          await supabaseAdmin.from('bench_impacts').upsert({
            impact_id: match.fixture_id + '_' + imp.player_id,
            fixture_id: match.fixture_id,
            player_id: imp.player_id,
            team: imp.team,
            likely_position: imp.likely_position,
            unit_score_before: imp.unit_score_before,
            unit_score_after: imp.unit_score_after,
            delta: imp.delta,
            flagged: imp.flagged
          }, { onConflict: 'impact_id' })
        }
      }
      processed++
    }
    return NextResponse.json({ ok: true, processed })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}