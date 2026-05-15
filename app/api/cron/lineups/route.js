import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch } from '@/lib/soccerDataApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 30 * 60000).toISOString()
    const windowEnd   = new Date(now.getTime() + 90 * 60000).toISOString()

    const { data: matches } = await supabaseAdmin.from('matches')
      .select('fixture_id, sd_match_id, score_state')
      .in('status', ['scheduled', 'pre-match'])
      .gte('kickoff_time', windowStart)
      .lte('kickoff_time', windowEnd)
      .not('sd_match_id', 'is', null)

    if (!matches?.length) return NextResponse.json({ ok: true, confirmed: 0 })

    let confirmed = 0
    for (const match of matches) {
      try {
        const detail = await fetchMatch(match.sd_match_id)
        if (!detail) continue

        const homeLineup = detail.home_lineup || []
        const awayLineup = detail.away_lineup || []
        const hasConfirmed = homeLineup.length >= 11 && awayLineup.length >= 11

        if (hasConfirmed && match.score_state < 4) {
          await supabaseAdmin.from('matches')
            .update({ score_state: 4 })
            .eq('fixture_id', match.fixture_id)
          confirmed++
        }
      } catch(err) {
        console.error('Lineup check error:', match.fixture_id, err.message)
      }
    }

    return NextResponse.json({ ok: true, confirmed, checked: matches.length })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}