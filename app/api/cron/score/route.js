import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { calcFormationWeights, calcMatchTempo } from '@/lib/scorer'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('*').in('status', ['scheduled','live'])
    if (!matches?.length) return NextResponse.json({ ok: true, scored: 0 })
    let scored = 0
    for (const match of matches) {
      const { data: homeTeam } = await supabaseAdmin.from('teams').select('*').eq('name', match.home_team).single()
      const { data: awayTeam } = await supabaseAdmin.from('teams').select('*').eq('name', match.away_team).single()
      const homeFormation = homeTeam?.formation_profile?.current || '4-3-3'
      const awayFormation = awayTeam?.formation_profile?.current || '4-3-3'
      const weights = calcFormationWeights(homeFormation, awayFormation)
      const tempo = calcMatchTempo(homeTeam?.manager_ppda, awayTeam?.manager_ppda)
      const homeAdv = Math.round((50 + weights.central * 5 + tempo.homePressIntensity * 3) * 10) / 10
      const awayAdv = Math.round((50 - weights.central * 5 + tempo.awayPressIntensity * 3) * 10) / 10
      const scoreId = match.fixture_id + '_' + (match.score_state || 1)
      await supabaseAdmin.from('match_scores').upsert({
        score_id: scoreId,
        fixture_id: match.fixture_id,
        score_state: match.score_state || 1,
        total_home: homeAdv,
        total_away: awayAdv,
        central_clash: Math.round(weights.central * 100),
        wide_battle: Math.round(weights.wide * 100),
        set_piece: Math.round(weights.setpiece * 100),
        momentum_direction: homeAdv > awayAdv ? 'home' : 'away',
        momentum_strength: Math.round(Math.abs(homeAdv - awayAdv) * 10) / 10,
        modifiers: { tempo: tempo.tempo, xGMultiplier: tempo.xGMultiplier },
        created_at: new Date().toISOString()
      }, { onConflict: 'score_id' })
      scored++
    }
    return NextResponse.json({ ok: true, scored })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}