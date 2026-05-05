import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchResults } from '@/lib/footballApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || yesterday
    const fixtures = await fetchResults(date)
    let stored = 0
    for (const f of fixtures) {
      const fixture = f.fixture
      const teams = f.teams
      const goals = f.goals
      if (!fixture?.id) continue
      const homeScore = goals?.home ?? 0
      const awayScore = goals?.away ?? 0
      const outcome = homeScore > awayScore ? 'home_win' : awayScore > homeScore ? 'away_win' : 'draw'
      await supabaseAdmin.from('results').upsert({
        result_id: String(fixture.id),
        fixture_id: String(fixture.id),
        home_score: homeScore,
        away_score: awayScore,
        outcome,
        btts: homeScore > 0 && awayScore > 0,
        total_goals: homeScore + awayScore,
        settled_at: new Date().toISOString()
      }, { onConflict: 'result_id' })
      await supabaseAdmin.from('matches').update({
        status: 'FT', home_score: homeScore, away_score: awayScore, score_state: 6
      }).eq('fixture_id', String(fixture.id))
      stored++
    }
    return NextResponse.json({ ok: true, stored, date })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}