import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { scoreUnitInteractions } from '@/lib/unitScorer'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const today = new Date().toISOString().split('T')[0]

    // Get matches with lineups
    const { data: scores } = await supabaseAdmin
      .from('match_scores')
      .select('fixture_id, modifiers, score_state')
      .gte('score_state', 3)
      .order('score_state', { ascending: false })

    if (!scores?.length) return NextResponse.json({ ok: true, scored: 0 })

    // Only score todays matches
    const { data: todayMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', today + 'T23:59:59Z')

    const todayIds = new Set((todayMatches || []).map(m => m.fixture_id))
    const toScore = scores.filter(s => todayIds.has(s.fixture_id))

    let scored = 0
    for (const s of toScore) {
      const mods = s.modifiers || {}
      const homeLineup = mods.home_lineup || []
      const awayLineup = mods.away_lineup || []
      if (!homeLineup.length && !awayLineup.length) continue

      const result = await scoreUnitInteractions(s.fixture_id, homeLineup, awayLineup)
      if (result) scored++
    }

    return NextResponse.json({ ok: true, scored })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}