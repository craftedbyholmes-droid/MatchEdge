import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { data: match } = await supabaseAdmin.from('matches').select('*').eq('fixture_id', id).single()
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: score } = await supabaseAdmin.from('match_scores')
      .select('*').eq('fixture_id', id).order('created_at', { ascending: false }).limit(1).single()
    const { data: impacts } = await supabaseAdmin.from('bench_impacts')
      .select('*').eq('fixture_id', id).eq('flagged', true)
    return NextResponse.json({ match, score: score || null, impacts: impacts || [] })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}