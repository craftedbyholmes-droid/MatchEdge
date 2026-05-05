import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { PERSONAS, calcPnL } from '@/lib/personas'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: unsettled } = await supabaseAdmin.from('persona_picks')
      .select('*').eq('pick_date', today).is('outcome', null)
    if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0 })
    let settled = 0
    for (const pick of unsettled) {
      const { data: match } = await supabaseAdmin.from('matches')
        .select('status, home_score, away_score').eq('fixture_id', pick.fixture_id).single()
      if (!match || match.status !== 'FT') continue
      const { data: result } = await supabaseAdmin.from('results')
        .select('outcome, btts, total_goals').eq('fixture_id', pick.fixture_id).single()
      if (!result) continue
      const outcome = determineOutcome(pick, result, match)
      const pl = calcPnL({ ...pick, outcome })
      await supabaseAdmin.from('persona_picks').update({
        outcome, profit_loss: pl, settled_at: new Date().toISOString()
      }).eq('pick_id', pick.pick_id)
      await updatePersonaSeason(pick.persona, outcome, pick.stake, pl, pick.odds_decimal)
      settled++
    }
    return NextResponse.json({ ok: true, settled })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

function determineOutcome(pick, result, match) {
  const market = pick.market
  if (market === 'match_result') {
    const sel = pick.selection?.toLowerCase()
    if (sel?.includes('home') || sel === match.home_team?.toLowerCase()) return result.outcome === 'home_win' ? 'win' : 'loss'
    if (sel?.includes('away') || sel === match.away_team?.toLowerCase()) return result.outcome === 'away_win' ? 'win' : 'loss'
    if (sel?.includes('draw')) return result.outcome === 'draw' ? 'win' : 'loss'
  }
  if (market === 'btts') {
    const sel = pick.selection?.toLowerCase()
    return (sel === 'yes' && result.btts) || (sel === 'no' && !result.btts) ? 'win' : 'loss'
  }
  if (market === 'over_25') {
    return result.total_goals > 2.5 ? 'win' : 'loss'
  }
  return 'loss'
}

async function updatePersonaSeason(persona, outcome, stake, pl, oddsDecimal) {
  const { data: cur } = await supabaseAdmin.from('persona_season').select('*').eq('persona', persona).single()
  const c = cur || { total_picks:0, wins:0, losses:0, voids:0, total_staked:0, total_returned:0, profit_loss:0 }
  const isVoid = outcome === 'void'
  const updates = {
    persona,
    total_picks: c.total_picks + (isVoid ? 0 : 1),
    wins: c.wins + (outcome === 'win' ? 1 : 0),
    losses: c.losses + (outcome === 'loss' ? 1 : 0),
    voids: c.voids + (isVoid ? 1 : 0),
    total_staked: c.total_staked + (isVoid ? 0 : stake),
    total_returned: c.total_returned + (outcome === 'win' ? stake * oddsDecimal : isVoid ? stake : 0),
    profit_loss: c.profit_loss + pl,
    updated_at: new Date().toISOString()
  }
  updates.win_rate = updates.total_picks > 0 ? Math.round((updates.wins / updates.total_picks) * 100) / 100 : 0
  updates.roi = updates.total_staked > 0 ? Math.round((updates.profit_loss / updates.total_staked) * 100) / 100 : 0
  await supabaseAdmin.from('persona_season').upsert(updates, { onConflict: 'persona' })
}