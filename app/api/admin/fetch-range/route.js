import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchFixturesByDateRange, mapFDMatch } from '@/lib/footballDataOrg'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    if (!dateFrom || !dateTo)
      return NextResponse.json({ error: 'from and to dates required' }, { status: 400 })
    const fixtures = await fetchFixturesByDateRange(dateFrom, dateTo)
    let inserted = 0
    for (const f of fixtures) {
      const row = mapFDMatch(f)
      const { error } = await supabaseAdmin.from('matches').upsert(row, { onConflict: 'fixture_id' })
      if (!error) inserted++
    }
    return NextResponse.json({ ok: true, inserted, total: fixtures.length, dateFrom, dateTo })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}