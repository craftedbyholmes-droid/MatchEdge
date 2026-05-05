import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const { data: pending } = await supabaseAdmin
      .from('weight_adaptations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    const { data: weights } = await supabaseAdmin.from('league_weights').select('*').order('league_name')
    const { data: accuracy } = await supabaseAdmin
      .from('prediction_accuracy')
      .select('league_name, result_correct, goals_correct, match_date')
      .order('match_date', { ascending: false })
      .limit(200)
    const leagueStats = {}
    for (const row of (accuracy || [])) {
      if (!leagueStats[row.league_name]) leagueStats[row.league_name] = { total: 0, correct: 0 }
      leagueStats[row.league_name].total++
      if (row.result_correct) leagueStats[row.league_name].correct++
    }
    return NextResponse.json({ pending: pending || [], weights: weights || [], leagueStats })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { id, action, override_weight } = body
    const { data: adaptation } = await supabaseAdmin.from('weight_adaptations').select('*').eq('id', id).single()
    if (!adaptation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const finalWeight = action === 'override' && override_weight
      ? parseFloat(override_weight)
      : action === 'approve' ? adaptation.suggested_weight : null

    if (finalWeight !== null) {
      const colMap = {
        standing: 'standing_weight', h2h: 'h2h_weight', home_adv: 'home_adv_weight',
        odds: 'odds_weight', ai_pred: 'ai_pred_weight', form: 'form_weight',
        sidelined: 'sidelined_weight', intl_synergy: 'intl_synergy_weight'
      }
      const col = colMap[adaptation.factor_name]
      if (col) {
        await supabaseAdmin.from('league_weights')
          .update({ [col]: finalWeight, updated_at: new Date().toISOString() })
          .eq('league_name', adaptation.league_name)
      }
    }

    await supabaseAdmin.from('weight_adaptations').update({
      status: action === 'reject' ? 'rejected' : 'approved',
      admin_override: override_weight ? parseFloat(override_weight) : null,
      reviewed_at: new Date().toISOString()
    }).eq('id', id)

    return NextResponse.json({ ok: true, applied: finalWeight })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}