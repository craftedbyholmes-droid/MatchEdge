const API_BASE = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY

async function apiFetch(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'x-apisports-key': API_KEY }
  })
  if (!res.ok) throw new Error('API-Football error: ' + res.status + ' ' + endpoint)
  const data = await res.json()
  if (data.errors && Object.keys(data.errors).length > 0 && !Array.isArray(data.errors)) {
    throw new Error('API-Football errors: ' + JSON.stringify(data.errors))
  }
  return data
}

export const LEAGUES = { EPL: 39, SPL: 179 }

// Fetch by exact date - no season param
export async function fetchFixtures(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&date=' + date)
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) { console.error('fetchFixtures error:', err.message) }
  }
  return out
}

// Fetch by date range - no season param
export async function fetchFixturesByRange(dateFrom, dateTo) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&from=' + dateFrom + '&to=' + dateTo)
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) { console.error('fetchFixturesByRange error:', err.message) }
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
    try {
      const d = await apiFetch('/injuries?league=' + id + '&season=2025')
      if (d.response) d.response.forEach(i => out.push({ leagueName: name, ...i }))
    } catch(err) { console.error('fetchInjuries error:', err.message) }
  }
  return out
}

export async function fetchOdds(id) {
  try {
    const d = await apiFetch('/odds?fixture=' + id)
    return d.response || []
  } catch(err) { return [] }
}

export async function fetchResults(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&date=' + date + '&status=FT')
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) { console.error('fetchResults error:', err.message) }
  }
  return out
}