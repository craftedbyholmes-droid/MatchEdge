import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchUpcomingFixtures, sdDateToISO } from '@/lib/soccerDataApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    const allFixtures = await fetchUpcomingFixtures()
    const fixtures = dateFrom && dateTo
      ? allFixtures.filter(f => {
          if (!f.date) return false
          const parts = f.date.split('/')
          if (parts.length !== 3) return false
          const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
          return iso >= dateFrom && iso <= dateTo
        })
      : allFixtures
    let inserted = 0
    let skipped = 0
    for (const f of fixtures) {
      const kickoff = sdDateToISO(f.date, f.time)
      if (!kickoff || !f.home_team || !f.away_team) { skipped++; continue }
      const row = {
        fixture_id: 'sd_' + f.sd_match_id,
        home_team: f.home_team,
        away_team: f.away_team,
        league: f.league_name,
        league_code: f.league_code || '',
        season: '2025/26',
        kickoff_time: kickoff,
        status: 'scheduled',
        score_state: 1,
        sd_match_id: f.sd_match_id,
        excitement_rating: f.excitement_rating
      }
      const { error } = await supabaseAdmin.from('matches').upsert(row, { onConflict: 'fixture_id' })
      if (!error) inserted++
      else skipped++
    }
    return NextResponse.json({ ok: true, inserted, skipped, total: fixtures.length, dateFrom: dateFrom || 'all', dateTo: dateTo || 'all' })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}