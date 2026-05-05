import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchFixturesByRange } from '@/lib/footballApi'
import { fetchFixturesByDateRange, mapFDMatch } from '@/lib/footballDataOrg'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    if (!dateFrom || !dateTo)
      return NextResponse.json({ error: 'from and to dates required' }, { status: 400 })

    let inserted = 0
    let total = 0
    const sources = []

    // Primary: API-Football range endpoint
    try {
      const afFixtures = await fetchFixturesByRange(dateFrom, dateTo)
      total += afFixtures.length
      for (const f of afFixtures) {
        const row = {
          fixture_id: String(f.fixture.id),
          home_team: f.teams.home.name,
          away_team: f.teams.away.name,
          league: f.leagueName || 'EPL',
          season: '2024/25',
          kickoff_time: f.fixture.date,
          venue: f.fixture.venue?.name || '',
          status: 'scheduled',
          score_state: 1
        }
        const { error } = await supabaseAdmin.from('matches').upsert(row, { onConflict: 'fixture_id' })
        if (!error) inserted++
      }
      if (afFixtures.length > 0) sources.push('api-football')
    } catch(err) {
      console.log('API-Football range failed, falling back to football-data.org:', err.message)
    }

    // Fallback: football-data.org if API-Football returned nothing
    if (inserted === 0) {
      try {
        const fdFixtures = await fetchFixturesByDateRange(dateFrom, dateTo)
        total += fdFixtures.length
        for (const f of fdFixtures) {
          const row = mapFDMatch(f)
          const { error } = await supabaseAdmin.from('matches').upsert(row, { onConflict: 'fixture_id' })
          if (!error) inserted++
        }
        if (fdFixtures.length > 0) sources.push('football-data.org')
      } catch(err) {
        console.error('football-data.org fallback error:', err.message)
      }
    }

    return NextResponse.json({ ok: true, inserted, total, sources, dateFrom, dateTo })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}