import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchFixtures } from '@/lib/footballApi'
export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' },{ status:401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0]
    const all = [...await fetchFixtures(today), ...await fetchFixtures(tomorrow)]
    let inserted = 0
    for (const f of all) {
      const { error } = await supabaseAdmin.from('matches').upsert({ fixture_id: String(f.fixture.id), home_team: f.teams.home.name, away_team: f.teams.away.name, league: f.leagueName||'EPL', season: '2025/26', kickoff_time: f.fixture.date, venue: f.fixture.venue?.name||'', status: 'scheduled', score_state: 1 },{ onConflict:'fixture_id' })
      if (!error) inserted++
    }
    return NextResponse.json({ ok:true, inserted, total:all.length })
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}