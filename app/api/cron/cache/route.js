import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    for (const [key, date] of [['matches_today', today], ['matches_tomorrow', tomorrow]]) {
      const { data: matches } = await supabaseAdmin.from('matches')
        .select('fixture_id, home_team, away_team, league, kickoff_time, status, score_state')
        .gte('kickoff_time', date + 'T00:00:00Z')
        .lt('kickoff_time', date + 'T23:59:59Z')
        .order('kickoff_time', { ascending: true })
      const enriched = []
      for (const match of (matches || [])) {
        const { data: score } = await supabaseAdmin.from('match_scores')
          .select('total_home, total_away, momentum_direction, momentum_strength')
          .eq('fixture_id', match.fixture_id)
          .order('created_at', { ascending: false })
          .limit(1).single()
        enriched.push({ ...match, score: score || null })
      }
      await supabaseAdmin.from('cache').upsert({
        key, value: enriched, date, updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    }
    return NextResponse.json({ ok: true })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}