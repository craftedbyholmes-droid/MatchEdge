import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('fixture_id').eq('status', 'scheduled')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lt('kickoff_time', today + 'T23:59:59Z')
    if (!matches?.length) return NextResponse.json({ ok: true, updated: 0 })
    let updated = 0
    for (const match of matches) {
      await supabaseAdmin.from('matches')
        .update({ score_state: 3 })
        .eq('fixture_id', match.fixture_id)
        .eq('score_state', 1)
      updated++
    }
    return NextResponse.json({ ok: true, updated })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}