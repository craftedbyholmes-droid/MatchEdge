import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

const FACTORS = ['standing', 'h2h', 'home_adv', 'odds', 'ai_pred', 'form', 'sidelined']
const FACTOR_COLS = {
  standing: 'standing_weight', h2h: 'h2h_weight', home_adv: 'home_adv_weight',
  odds: 'odds_weight', ai_pred: 'ai_pred_weight', form: 'form_weight', sidelined: 'sidelined_weight'
}

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
    const { data: accuracy } = await supabaseAdmin
      .from('factor_accuracy')
      .select('*')
      .gte('match_date', cutoff)
    if (!accuracy?.length) return NextResponse.json({ ok: true, message: 'Insufficient data for calibration' })

    // Group by league and factor
    const byLeagueFactor = {}
    for (const row of accuracy) {
      const key = row.league_name + '|' + row.factor_name
      if (!byLeagueFactor[key]) byLeagueFactor[key] = { correct: 0, total: 0, league: row.league_name, factor: row.factor_name }
      byLeagueFactor[key].total++
      if (row.was_correct) byLeagueFactor[key].correct++
    }

    // Get current weights
    const { data: currentWeights } = await supabaseAdmin.from('league_weights').select('*')
    const weightMap = {}
    for (const w of (currentWeights || [])) weightMap[w.league_name] = w

    const suggestions = []
    for (const [key, stats] of Object.entries(byLeagueFactor)) {
      if (stats.total < 10) continue
      const accuracy_rate = stats.correct / stats.total
      const current = weightMap[stats.league]?.[FACTOR_COLS[stats.factor]] || 0.15

      // Suggest weight increase if accuracy > 65%, decrease if < 45%
      let suggested = current
      let reasoning = ''
      if (accuracy_rate > 0.65) {
        suggested = Math.min(current * 1.15, 0.45)
        reasoning = 'Factor correct ' + Math.round(accuracy_rate * 100) + '% of the time over ' + stats.total + ' matches. Suggest increasing weight.'
      } else if (accuracy_rate < 0.45) {
        suggested = Math.max(current * 0.85, 0.03)
        reasoning = 'Factor correct only ' + Math.round(accuracy_rate * 100) + '% of the time over ' + stats.total + ' matches. Suggest reducing weight.'
      } else {
        continue // No change needed
      }

      suggested = Math.round(suggested * 1000) / 1000
      if (Math.abs(suggested - current) < 0.005) continue

      suggestions.push({
        league_name: stats.league,
        factor_name: stats.factor,
        current_weight: current,
        suggested_weight: suggested,
        accuracy_change: Math.round((accuracy_rate - 0.5) * 100),
        sample_size: stats.total,
        reasoning,
        status: 'pending'
      })
    }

    // Clear old pending suggestions and insert new ones
    await supabaseAdmin.from('weight_adaptations').delete().eq('status', 'pending')
    if (suggestions.length > 0) {
      await supabaseAdmin.from('weight_adaptations').insert(suggestions)
    }

    return NextResponse.json({ ok: true, suggestions: suggestions.length, message: suggestions.length + ' weight adaptation suggestions generated' })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}