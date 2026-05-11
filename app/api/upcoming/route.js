import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const todayUK = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    const parts = todayUK.split('/')
    const today = parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0')
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const horizon  = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0]

    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, home_team_id, away_team_id, league, kickoff_time, status, score_state, sd_league_id')
      .gte('kickoff_time', tomorrow + 'T00:00:00Z')
      .lte('kickoff_time', horizon + 'T23:59:59Z')
      .in('status', ['scheduled', 'pre-match'])
      .not('home_team', 'is', null)
      .not('away_team', 'is', null)
      .order('kickoff_time', { ascending: true })

    if (!matches?.length) return NextResponse.json([])

    const enriched = []
    for (const match of matches) {
      const { data: score } = await supabaseAdmin
        .from('match_scores')
        .select('total_home, total_away, score_state, modifiers')
        .eq('fixture_id', match.fixture_id)
        .order('score_state', { ascending: false })
        .limit(1).single()
      enriched.push({ ...match, score: score || null })
    }
    return NextResponse.json(enriched)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}