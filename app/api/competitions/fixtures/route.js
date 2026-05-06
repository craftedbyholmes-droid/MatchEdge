import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchUpcomingByLeague, sdDateToISO } from '@/lib/soccerDataApi'
import { getCompetition } from '@/lib/competitions'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = parseInt(searchParams.get('league_id'))
    if (!leagueId) return NextResponse.json({ error: 'league_id required' }, { status: 400 })

    const comp = getCompetition(leagueId)
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    // Check if we have cached fixtures in DB for this competition
    const { data: cached } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, status, score_state, sd_match_id')
      .eq('sd_league_id', leagueId)
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', nextWeek + 'T23:59:59Z')
      .order('kickoff_time', { ascending: true })

    if (cached?.length > 0) {
      // Enrich with scores
      const enriched = []
      for (const match of cached) {
        const { data: score } = await supabaseAdmin
          .from('match_scores')
          .select('total_home, total_away, momentum_direction, modifiers')
          .eq('fixture_id', match.fixture_id)
          .order('created_at', { ascending: false })
          .limit(1).single()
        enriched.push({ ...match, score: score || null, competition: comp })
      }
      return NextResponse.json({ fixtures: enriched, source: 'cache', competition: comp })
    }

    // Fetch live from SoccerData
    const fixtures = await fetchUpcomingByLeague(leagueId)

    // Filter to this week
    const thisWeek = fixtures.filter(f => {
      if (!f.date) return false
      const parts = f.date.split('/')
      if (parts.length !== 3) return false
      const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
      return iso >= today && iso <= nextWeek
    })

    // Store in DB for future use
    for (const f of thisWeek) {
      const kickoff = sdDateToISO(f.date, f.time)
      if (!kickoff) continue
      await supabaseAdmin.from('matches').upsert({
        fixture_id: 'sd_' + f.sd_match_id,
        home_team: f.home_team,
        away_team: f.away_team,
        league: f.league_name,
        league_code: comp?.code || '',
        sd_league_id: leagueId,
        season: '2025/26',
        kickoff_time: kickoff,
        status: 'scheduled',
        score_state: 1,
        sd_match_id: f.sd_match_id
      }, { onConflict: 'fixture_id' })
    }

    return NextResponse.json({
      fixtures: thisWeek.map(f => ({ ...f, fixture_id: 'sd_' + f.sd_match_id, competition: comp })),
      source: 'live',
      competition: comp
    })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}