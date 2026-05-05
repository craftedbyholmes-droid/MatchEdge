import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
export async function GET() {
  try {
    const { data } = await supabaseAdmin.from('cache').select('value').eq('key','matches_tomorrow').single()
    return NextResponse.json(data?.value || [])
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}