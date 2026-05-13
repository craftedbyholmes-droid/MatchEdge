import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const id = params?.id || params
    console.log('Match detail requested for ID:', id)

    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('fixture_id', id)
      .single()

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    // Get all score states
    const { data: scores } = await supabaseAdmin
      .from('match_scores')
      .select('*')
      .eq('fixture_id', id)
      .order('score_state', { ascending: true })

    // Get goal events
    const { data: events } = await supabaseAdmin
      .from('match_event_log')
      .select('*')
      .eq('fixture_id', id)
      .order('minute', { ascending: true })

    // Get tipster picks for this match
    const { data: picks } = await supabaseAdmin
      .from('persona_picks')
      .select('persona, selection, odds_fractional, odds_decimal, market, outcome, profit_loss, tip_text, is_best_pick, stake')
      .eq('fixture_id', id)

    // Latest score state
    const latest = scores?.length ? scores[scores.length - 1] : null
    const mods = latest?.modifiers || {}

    return NextResponse.json({
      match,
      scores: scores || [],
      latest_score: latest,
      modifiers: mods,
      events: events || [],
      picks: picks || [],
      odds: mods.odds || null,
      factors: mods.factors || null,
      weights: mods.weights_used || null,
      excitement: mods.excitement || null,
      formation_home: mods.formation_home || null,
      formation_away: mods.formation_away || null,
      home_lineup: mods.home_lineup || [],
      away_lineup: mods.away_lineup || [],
      home_sidelined: mods.home_sidelined || [],
      away_sidelined: mods.away_sidelined || [],
      preview_prediction: mods.preview_prediction || null
    })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}