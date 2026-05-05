const API_BASE = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_ORG_KEY

async function fdFetch(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'X-Auth-Token': API_KEY }
  })
  if (!res.ok) throw new Error('football-data.org error: ' + res.status + ' ' + endpoint)
  return res.json()
}

export const FD_COMPETITIONS = { EPL: 'PL' }

export async function fetchFixturesByDateRange(dateFrom, dateTo) {
  const out = []
  for (const [name, code] of Object.entries(FD_COMPETITIONS)) {
    try {
      const d = await fdFetch('/competitions/' + code + '/matches?dateFrom=' + dateFrom + '&dateTo=' + dateTo)
      if (d.matches) {
        d.matches.forEach(m => out.push({ leagueName: name, source: 'football-data.org', ...m }))
      }
    } catch(err) {
      console.error('football-data.org error for ' + name + ':', err.message)
    }
  }
  return out
}

export function mapFDMatch(m) {
  return {
    fixture_id: 'fd_' + m.id,
    home_team: m.homeTeam?.name || 'Unknown',
    away_team: m.awayTeam?.name || 'Unknown',
    league: m.leagueName || 'EPL',
    season: '2024/25',
    kickoff_time: m.utcDate,
    venue: m.homeTeam?.venue || '',
    status: mapStatus(m.status),
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    score_state: 1
  }
}

function mapStatus(status) {
  if (status === 'FINISHED') return 'FT'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'live'
  if (status === 'POSTPONED') return 'postponed'
  return 'scheduled'
}