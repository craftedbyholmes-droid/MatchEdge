import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { afFetch, AF_LEAGUE_IDS } from '@/lib/apiFootball'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get todays and tomorrows matches that dont have AF fixture IDs yet
    const today    = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, sd_league_id')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', tomorrow + 'T23:59:59Z')
      .in('status', ['scheduled', 'pre-match'])
      .limit(20)

    if (!matches?.length) return NextResponse.json({ ok: true, mapped: 0 })

    // Check which already have AF IDs
    const { data: existing } = await supabaseAdmin
      .from('af_fixture_map')
      .select('fixture_id')
      .in('fixture_id', matches.map(m => m.fixture_id))

    const existingIds = new Set((existing || []).map(e => e.fixture_id))
    const toFetch = matches.filter(m => !existingIds.has(m.fixture_id))

    if (!toFetch.length) return NextResponse.json({ ok: true, mapped: 0, message: 'All already mapped' })

    let mapped = 0
    let apiCalls = 0

    for (const match of toFetch) {
      try {
        const leagueId = AF_LEAGUE_IDS[match.league]
        if (!leagueId) continue

        const date = match.kickoff_time.split('T')[0]
        const data = await afFetch('/fixtures?league=' + leagueId + '&season=2024&date=' + date)
        apiCalls++

        const fixtures = data?.response || []
        const found = fixtures.find(f => {
          const home = (f.teams?.home?.name || '').toLowerCase()
          const away = (f.teams?.away?.name || '').toLowerCase()
          const mHome = (match.home_team || '').toLowerCase()
          const mAway = (match.away_team || '').toLowerCase()
          // Fuzzy match - check if key words match
          const homeMatch = home.split(' ').some(w => w.length > 3 && mHome.includes(w)) ||
                            mHome.split(' ').some(w => w.length > 3 && home.includes(w))
          const awayMatch = away.split(' ').some(w => w.length > 3 && mAway.includes(w)) ||
                            mAway.split(' ').some(w => w.length > 3 && away.includes(w))
          return homeMatch && awayMatch
        })

        if (found) {
          await supabaseAdmin.from('af_fixture_map').upsert({
            fixture_id:   match.fixture_id,
            af_fixture_id: found.fixture?.id,
            fetched_at:   new Date().toISOString()
          }, { onConflict: 'fixture_id' })
          mapped++
        }
      } catch(err) {
        console.error('AF fixture map error:', match.fixture_id, err.message)
      }
    }

    return NextResponse.json({ ok: true, mapped, apiCalls, checked: toFetch.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}