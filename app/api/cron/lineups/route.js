import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchLineup } from '@/lib/footballApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 90 * 60000).toISOString()
    const windowEnd = new Date(now.getTime() + 90 * 60000).toISOString()
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('fixture_id').eq('status', 'scheduled')
      .gte('kickoff_time', windowStart).lte('kickoff_time', windowEnd)
    if (!matches?.length) return NextResponse.json({ ok: true, confirmed: 0 })
    let confirmed = 0
    for (const match of matches) {
      const lineups = await fetchLineup(match.fixture_id)
      if (lineups?.length >= 2) {
        await supabaseAdmin.from('matches')
          .update({ score_state: 4 }).eq('fixture_id', match.fixture_id)
        confirmed++
      }
    }
    return NextResponse.json({ ok: true, confirmed })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}