import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    let query = supabaseAdmin.from('wc_matches').select('*').order('kickoff_time', { ascending: true })
    if (stage) query = query.eq('stage', stage)
    const { data } = await query
    return NextResponse.json(data || [])
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}