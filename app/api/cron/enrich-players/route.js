import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchAndCacheFixtureStats } from '@/lib/unitScorer'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const today = new Date().toISOString().split('T')[0]

    // Get todays matches with AF fixture IDs
    const { data: maps } = await supabaseAdmin
      .from('af_fixture_map')
      .select('fixture_id, af_fixture_id')
      .not('af_fixture_id', 'is', null)

    if (!maps?.length) return NextResponse.json({ ok: true, enriched: 0, message: 'No AF fixture IDs mapped yet' })

    const { data: todayMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, league')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', today + 'T23:59:59Z')

    const todayIds = new Set((todayMatches || []).map(m => m.fixture_id))
    const toEnrich = maps.filter(m => todayIds.has(m.fixture_id))

    let enriched = 0
    let apiCalls = 0

    for (const map of toEnrich) {
      const match = todayMatches.find(m => m.fixture_id === map.fixture_id)
      const result = await fetchAndCacheFixtureStats(map.fixture_id, map.af_fixture_id, match?.league)
      if (result?.fetched) { enriched++; apiCalls++ }
    }

    return NextResponse.json({ ok: true, enriched, apiCalls, available: toEnrich.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}