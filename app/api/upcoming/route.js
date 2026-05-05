import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, league_code, kickoff_time, status, score_state')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .in('status', ['scheduled', 'postponed'])
      .order('kickoff_time', { ascending: true })
      .limit(200)
    if (!matches?.length) return NextResponse.json([])
    const enriched = []
    for (const match of matches) {
      const { data: score } = await supabaseAdmin
        .from('match_scores')
        .select('total_home, total_away, momentum_direction, momentum_strength, modifiers')
        .eq('fixture_id', match.fixture_id)
        .order('created_at', { ascending: false })
        .limit(1).single()
      enriched.push({ ...match, score: score || null })
    }
    return NextResponse.json(enriched)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}