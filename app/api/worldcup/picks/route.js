import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabaseAdmin.from('wc_picks').select('*').eq('pick_date', today).order('engine_score', { ascending: false })
    return NextResponse.json(data || [])
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}