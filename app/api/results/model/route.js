import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // All matches we have engine scores for, past kickoff
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, status, home_score, away_score')
      .lt('kickoff_time', today + 'T23:59:59Z')
      .not('home_team', 'is', null)
      .not('away_team', 'is', null)
      .order('kickoff_time', { ascending: false })
      .limit(300)

    if (!matches?.length) return NextResponse.json([])

    // Get engine scores for each match
    const result = []
    for (const match of matches) {
      const { data: score } = await supabaseAdmin
        .from('match_scores')
        .select('total_home, total_away, score_state')
        .eq('fixture_id', match.fixture_id)
        .order('score_state', { ascending: false })
        .limit(1).single()
      if (score) result.push({ ...match, score })
    }

    return NextResponse.json(result)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}