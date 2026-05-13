import { NextResponse } from 'next/server'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.FOOTBALL_DATA_ORG_KEY || process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY

  // Test with Haaland - API Football player ID 1100
  // Also test fixture players endpoint to see what comes back
  const headers = {
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': key,
    'x-apisports-key': key
  }

  try {
    // Try direct API Sports endpoint first (no RapidAPI)
    const r1 = await fetch('https://v3.football.api-sports.io/players?id=1100&season=2024', { headers })
    const d1 = await r1.json()

    // Also check remaining calls
    const remaining = r1.headers.get('x-ratelimit-requests-remaining') || r1.headers.get('X-RateLimit-Remaining')

    return NextResponse.json({
      status: r1.status,
      remaining_calls: remaining,
      sample: d1?.response?.[0] || d1
    })
  } catch(err) {
    return NextResponse.json({ error: err.message })
  }
}