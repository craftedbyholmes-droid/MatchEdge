import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const todayUK = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    const parts = todayUK.split('/')
    const today = parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0')

    // Always query DB directly by today date - never serve stale cache
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, status, score_state')
      .gte('kickoff_time', today + 'T00:00:00+00:00')
      .lte('kickoff_time', today + 'T23:59:59+00:00')
      .order('kickoff_time', { ascending: true })

    if (!matches?.length) return NextResponse.json([])

    // Enrich with latest scores
    const enriched = []
    for (const match of matches) {
      const { data: score } = await supabaseAdmin
        .from('match_scores')
        .select('total_home, total_away, momentum_direction, modifiers')
        .eq('fixture_id', match.fixture_id)
        .order('score_state', { ascending: false })
        .limit(1)
        .single()
      enriched.push({ ...match, score: score || null })
    }

    return NextResponse.json(enriched)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}