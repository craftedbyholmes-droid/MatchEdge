import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET() {
  try {
    const { data: groups } = await supabaseAdmin.from('wc_groups').select('*').order('group_id')
    const { data: teams } = await supabaseAdmin.from('wc_teams').select('*').order('points', { ascending: false })
    if (!groups) return NextResponse.json([])
    const result = groups.map(g => ({
      ...g,
      teams: (teams || []).filter(t => t.group_id === g.group_id).sort((a,b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against))
    }))
    return NextResponse.json(result)
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}