import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const persona = searchParams.get('persona')
    const today = new Date().toISOString().split('T')[0]
    let q = supabaseAdmin.from('persona_picks').select('*').eq('pick_date',today).order('engine_score',{ascending:false})
    if (persona) q = q.eq('persona',persona)
    const { data } = await q
    return NextResponse.json(data || [])
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}