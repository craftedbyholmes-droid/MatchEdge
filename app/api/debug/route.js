import { NextResponse } from 'next/server'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const key = process.env.FOOTBALL_API_KEY
    const fdKey = process.env.FOOTBALL_DATA_ORG_KEY

    // Test API-Football range endpoint
    const afRes = await fetch('https://v3.football.api-sports.io/fixtures?league=39&season=2024&from=2026-05-09&to=2026-05-11', {
      headers: { 'x-apisports-key': key }
    })
    const afData = await afRes.json()

    // Test API-Football next endpoint
    const afNextRes = await fetch('https://v3.football.api-sports.io/fixtures?league=39&season=2024&next=5', {
      headers: { 'x-apisports-key': key }
    })
    const afNextData = await afNextRes.json()

    // Test football-data.org
    const fdRes = await fetch('https://api.football-data.org/v4/competitions/PL/matches?dateFrom=2026-05-09&dateTo=2026-05-11', {
      headers: { 'X-Auth-Token': fdKey }
    })
    const fdData = await fdRes.json()

    return NextResponse.json({
      apiFootball: {
        range: { status: afRes.status, count: afData.response?.length || 0, errors: afData.errors },
        next: { status: afNextRes.status, count: afNextData.response?.length || 0, errors: afNextData.errors, firstMatch: afNextData.response?.[0] ? afNextData.response[0].teams.home.name + ' vs ' + afNextData.response[0].teams.away.name : null }
      },
      footballDataOrg: {
        status: fdRes.status,
        count: fdData.matches?.length || 0,
        firstMatch: fdData.matches?.[0] ? fdData.matches[0].homeTeam.name + ' vs ' + fdData.matches[0].awayTeam.name : null
      }
    })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}