import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchLiveFixtures } from '@/lib/footballApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const live = await fetchLiveFixtures()
    let updated = 0
    for (const f of live) {
      const goals = f.goals
      const status = f.fixture?.status?.short
      const matchStatus = status === 'FT' ? 'FT' : 'live'
      await supabaseAdmin.from('matches').update({
        status: matchStatus,
        home_score: goals?.home ?? null,
        away_score: goals?.away ?? null,
        score_state: matchStatus === 'FT' ? 6 : 5
      }).eq('fixture_id', String(f.fixture.id))
      updated++
    }
    return NextResponse.json({ ok: true, updated })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}