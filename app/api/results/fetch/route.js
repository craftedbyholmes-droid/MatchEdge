import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const targetDate = searchParams.get('date') || yesterday
    const persona = searchParams.get('persona')
    let query = supabaseAdmin.from('persona_picks')
      .select('*, matches(home_team, away_team, home_score, away_score, status)')
      .lt('pick_date', today)
      .order('pick_date', { ascending: false })
    if (persona) query = query.eq('persona', persona)
    const { data } = await query.limit(100)
    return NextResponse.json(data || [])
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}