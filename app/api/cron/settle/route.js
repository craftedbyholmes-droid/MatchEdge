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
    let settled = 0
    for (const pick of (unsettled || [])) {
      const { data: match } = await supabaseAdmin.from('matches')
        .select('status, home_score, away_score, league').eq('fixture_id', pick.fixture_id).single()
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

      // Log prediction accuracy for engine calibration
      const { data: score } = await supabaseAdmin.from('match_scores')
        .select('total_home, total_away, modifiers').eq('fixture_id', pick.fixture_id)
        .order('created_at', { ascending: false }).limit(1).single()
      if (score) {
        const predictedWinner = score.total_home > score.total_away ? 'home' : score.total_away > score.total_home ? 'away' : 'draw'
        const actualWinner = result.outcome
        const resultCorrect = predictedWinner === actualWinner
        const goalsCorrect = result.total_goals != null && Math.abs((score.total_home + score.total_away) / 20 - result.total_goals) <= 1
        await supabaseAdmin.from('prediction_accuracy').upsert({
          fixture_id: pick.fixture_id,
          league_name: match.league || 'Unknown',
          match_date: today,
          predicted_home: score.total_home,
          predicted_away: score.total_away,
          predicted_winner: predictedWinner,
          actual_home_score: match.home_score,
          actual_away_score: match.away_score,
          actual_outcome: actualWinner,
          result_correct: resultCorrect,
          goals_correct: goalsCorrect,
          score_gap_error: Math.abs(score.total_home - score.total_away) - Math.abs((match.home_score || 0) - (match.away_score || 0))
        }, { onConflict: 'fixture_id' })

        // Log per-factor accuracy
        const mods = score.modifiers || {}
        for (const [factor, val] of Object.entries(mods)) {
          if (typeof val !== 'number') continue
          const factorSignal = val > 0 ? 'home' : val < 0 ? 'away' : 'neutral'
          const wasCorrect = factorSignal === actualWinner || (factorSignal === 'neutral' && actualWinner === 'draw')
          await supabaseAdmin.from('factor_accuracy').insert({
            league_name: match.league || 'Unknown',
            factor_name: factor,
            match_date: today,
            fixture_id: pick.fixture_id,
            predicted_home: score.total_home,
            predicted_away: score.total_away,
            actual_outcome: actualWinner,
            factor_signal: factorSignal,
            was_correct: wasCorrect,
            score_gap: Math.abs(score.total_home - score.total_away),
            goals_total: result.total_goals
          })
        }
      }
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
  if (market === 'btts') { const sel = pick.selection?.toLowerCase(); return (sel === 'yes' && result.btts) || (sel === 'no' && !result.btts) ? 'win' : 'loss' }
  if (market === 'over_25') return result.total_goals > 2.5 ? 'win' : 'loss'
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