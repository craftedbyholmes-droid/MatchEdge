import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')

    const { data: season } = await supabaseAdmin.from('persona_season').select('*')

    if (ticker) {
      const { data: recent } = await supabaseAdmin
        .from('persona_picks')
        .select('persona, selection, odds_fractional, outcome, profit_loss, home_team, away_team')
        .in('outcome', ['win', 'loss', 'void'])
        .order('settled_at', { ascending: false })
        .limit(20)
      return NextResponse.json({ ticker: recent || [] })
    }

    const { data: picks } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .not('pick_date', 'is', null)
      .order('pick_date', { ascending: false })
      .limit(500)

    const fixtureIds = [...new Set((picks || []).map(p => p.fixture_id).filter(Boolean))]
    const { data: matchData } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team_id, away_team_id')
      .in('fixture_id', fixtureIds)
    const matchMap = {}
    for (const m of (matchData || [])) matchMap[m.fixture_id] = m
    const enrichedPicks = (picks || []).map(p => ({
      ...p,
      home_team_id: matchMap[p.fixture_id]?.home_team_id || null,
      away_team_id: matchMap[p.fixture_id]?.away_team_id || null
    }))

    const { data: modelMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, home_team_id, away_team_id, league, kickoff_time, status, home_score, away_score')
      .in('status', ['FT', 'finished'])
      .order('kickoff_time', { ascending: false })
      .limit(200)

    const modelWithScores = []
    for (const m of (modelMatches || [])) {
      const { data: score } = await supabaseAdmin
        .from('match_scores')
        .select('total_home, total_away, score_state')
        .eq('fixture_id', m.fixture_id)
        .order('score_state', { ascending: false })
        .limit(1).single()
      if (score) modelWithScores.push({ ...m, score })
    }

    return NextResponse.json({ season: season || [], recent: enrichedPicks, model: modelWithScores })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}