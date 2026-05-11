import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const [{ data: groups }, { data: teams }, { data: matches }] = await Promise.all([
      supabaseAdmin.from('wc_groups').select('*').order('group_id'),
      supabaseAdmin.from('wc_teams').select('*').order('points', { ascending: false }),
      supabaseAdmin.from('wc_matches').select('*').eq('stage', 'group').order('kickoff_time')
    ])

    // Get engine scores for any scored matches
    const scoredIds = (matches || []).filter(m => m.sd_match_id).map(m => 'sd_' + m.sd_match_id)
    let scoreMap = {}
    if (scoredIds.length) {
      const { data: scores } = await supabaseAdmin
        .from('wc_match_scores')
        .select('fixture_id, total_home, total_away, score_state')
        .in('fixture_id', scoredIds)
      for (const s of (scores || [])) scoreMap[s.fixture_id] = s
    }

    // Attach scores to matches
    const enriched = (matches || []).map(m => ({
      ...m,
      score: scoreMap['sd_' + m.sd_match_id] || null
    }))

    return NextResponse.json({ groups: groups || [], teams: teams || [], matches: enriched })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}