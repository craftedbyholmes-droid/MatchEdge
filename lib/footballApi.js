const API_BASE = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY

async function apiFetch(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: {
      'x-apisports-key': API_KEY
    }
  })
  if (!res.ok) throw new Error('API-Football error: ' + res.status + ' ' + endpoint)
  const data = await res.json()
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error('API-Football errors: ' + JSON.stringify(data.errors))
  }
  return data
}

export const LEAGUES = { EPL: 39, SPL: 179 }
export const CURRENT_SEASON = 2024

export async function fetchFixtures(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&date=' + date)
    if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
  }
  return out
}

export async function fetchLiveFixtures() {
  const d = await apiFetch('/fixtures?live=' + Object.values(LEAGUES).join('-'))
  return d.response || []
}

export async function fetchLineup(id) {
  const d = await apiFetch('/fixtures?id=' + id)
  return d.response?.[0]?.lineups || []
}

export async function fetchPlayerStats(id) {
  const d = await apiFetch('/players?fixture=' + id)
  return d.response || []
}

export async function fetchInjuries() {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    const d = await apiFetch('/injuries?league=' + id + '&season=' + CURRENT_SEASON)
    if (d.response) d.response.forEach(i => out.push({ leagueName: name, ...i }))
  }
  return out
}

export async function fetchOdds(id) {
  const d = await apiFetch('/odds?fixture=' + id)
  return d.response || []
}

export async function fetchResults(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&date=' + date + '&status=FT')
    if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
  }
  return out
}

export async function fetchH2H(teamA, teamB) {
  const d = await apiFetch('/fixtures?h2h=' + teamA + '-' + teamB + '&last=10')
  return d.response || []
}