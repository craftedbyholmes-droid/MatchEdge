import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('ticker') === 'true') {
      const { data } = await supabaseAdmin.from('persona_picks').select('persona,selection,odds_fractional,outcome,profit_loss,pick_date').not('outcome','is',null).neq('outcome','void').order('settled_at',{ascending:false}).limit(20)
      return NextResponse.json({ ticker: data || [] })
    }
    const today = new Date().toISOString().split('T')[0]
    const { data: season } = await supabaseAdmin.from('persona_season').select('*')
    const { data: recent } = await supabaseAdmin.from('persona_picks').select('*').lt('pick_date',today).order('pick_date',{ascending:false}).limit(50)
    return NextResponse.json({ season: season||[], recent: recent||[] })
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}