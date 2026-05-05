import { NextResponse } from 'next/server'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const headers = { 'authorization': 'Bearer ' + process.env.CRON_SECRET }
    await fetch(base + '/api/cron', { headers })
    await fetch(base + '/api/cron/score', { headers })
    await fetch(base + '/api/cron/cache', { headers })
    await fetch(base + '/api/personas', { headers })
    return NextResponse.json({ ok: true, message: 'Midnight chain complete' })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}