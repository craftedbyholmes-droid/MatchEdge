import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    // Get the next matchday with picks - could be today or tomorrow
    const now = new Date().toISOString()
    const horizon = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Find earliest pick_date >= today
    const { data: nextPicks } = await supabaseAdmin
      .from('persona_picks')
      .select('pick_date')
      .gte('pick_date', new Date().toISOString().split('T')[0])
      .lte('pick_date', horizon)
      .order('pick_date', { ascending: true })
      .limit(1)

    if (!nextPicks?.length) return NextResponse.json([])

    const nextMatchday = nextPicks[0].pick_date

    const { data } = await supabaseAdmin
      .from('persona_picks')
      .select('*')
      .eq('pick_date', nextMatchday)
      .order('engine_score', { ascending: false })

    return NextResponse.json(data || [])
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}