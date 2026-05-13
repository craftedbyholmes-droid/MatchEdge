import { NextResponse } from 'next/server'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.FOOTBALL_API_KEY
  if (!key) return NextResponse.json({ error: 'FOOTBALL_API_KEY not set' })

  const headers = {
    'x-apisports-key': key
  }

  try {
    // Test 1: Get Haaland stats - season 2024
    const r1 = await fetch('https://v3.football.api-sports.io/players?id=1100&season=2024', { headers })
    const d1 = await r1.json()
    const remaining = r1.headers.get('x-ratelimit-requests-remaining')
    const limit = r1.headers.get('x-ratelimit-requests-limit')

    // Test 2: Get players by fixture - to understand lineup enrichment
    // Use a recent PL fixture
    const r2 = await fetch('https://v3.football.api-sports.io/fixtures/players?fixture=1035056', { headers })
    const d2 = await r2.json()

    // Test 3: Search player by name to get API Football ID from name
    const r3 = await fetch('https://v3.football.api-sports.io/players?search=Haaland&season=2024', { headers })
    const d3 = await r3.json()

    return NextResponse.json({
      calls_remaining: remaining,
      calls_limit: limit,
      haaland_stats: d1?.response?.[0] || d1,
      fixture_players_sample: d2?.response?.[0] || d2,
      search_result: d3?.response?.[0] || d3
    })
  } catch(err) {
    return NextResponse.json({ error: err.message })
  }
}