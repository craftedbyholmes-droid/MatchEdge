import { NextResponse } from 'next/server'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const key = process.env.FOOTBALL_API_KEY
    const hasKey = !!key
    const keyPreview = key ? key.substring(0, 6) + '...' : 'MISSING'
    const res = await fetch('https://v3.football.api-sports.io/fixtures?league=39&season=2024&date=2026-05-10', {
      headers: { 'x-apisports-key': key }
    })
    const data = await res.json()
    return NextResponse.json({
      hasKey,
      keyPreview,
      apiStatus: res.status,
      resultsCount: data.response?.length || 0,
      errors: data.errors || null,
      firstResult: data.response?.[0]?.fixture || null
    })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}