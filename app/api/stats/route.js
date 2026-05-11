import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')

    // Season totals per persona
    const { data: season } = await supabaseAdmin
      .from('persona_season')
      .select('*')

    // Ticker mode - just last 10 settled picks
    if (ticker) {
      const { data: recent } = await supabaseAdmin
        .from('persona_picks')
        .select('persona, selection, odds_fractional, outcome, profit_loss')
        .in('outcome', ['win', 'loss'])
        .order('settled_at', { ascending: false })
        .limit(10)
      return NextResponse.json({ ticker: recent || [] })
    }

    // Full pick history with match scores joined
    const { data: picks } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .not('pick_date', 'is', null)
      .order('pick_date', { ascending: false })
      .order('kickoff_time', { ascending: true })
      .limit(500)

    // Model selections - all matches we scored with engine scores
    const today = new Date().toISOString().split('T')[0]
    const { data: modelMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, home_team, away_team, league, kickoff_time, status, home_score, away_score, sd_league_id')
      .lt('kickoff_time', today + 'T23:59:59Z')
      .in('status', ['FT', 'finished'])
      .order('kickoff_time', { ascending: false })
      .limit(200)

    // Enrich model matches with engine scores
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

    return NextResponse.json({
      season: season || [],
      recent: picks || [],
      model: modelWithScores
    })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}