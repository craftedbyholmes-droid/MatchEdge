const API_BASE = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY

async function apiFetch(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'x-apisports-key': API_KEY }
  })
  if (!res.ok) throw new Error('API-Football error: ' + res.status + ' ' + endpoint)
  const data = await res.json()
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errMsg = JSON.stringify(data.errors)
    throw new Error('API-Football errors: ' + errMsg)
  }
  return data
}

export const LEAGUES = { EPL: 39, SPL: 179 }
export const CURRENT_SEASON = 2025

// Fetch fixtures for a specific date
export async function fetchFixtures(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&date=' + date)
    if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
  }
  return out
}

// Fetch fixtures by date range - no plan restriction on this endpoint
export async function fetchFixturesByRange(dateFrom, dateTo) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&from=' + dateFrom + '&to=' + dateTo)
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) {
      console.error('API-Football range fetch error for ' + name + ':', err.message)
    }
  }
  return out
}

// Fetch next N upcoming fixtures per league
export async function fetchNextFixtures(count) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&next=' + count)
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) {
      console.error('API-Football next fetch error for ' + name + ':', err.message)
    }
  }
  return out
}

// Fetch live fixtures
export async function fetchLiveFixtures() {
  const d = await apiFetch('/fixtures?live=' + Object.values(LEAGUES).join('-'))
  return d.response || []
}

// Fetch lineup for a specific fixture
export async function fetchLineup(id) {
  const d = await apiFetch('/fixtures?id=' + id)
  return d.response?.[0]?.lineups || []
}

// Fetch player stats for a fixture
export async function fetchPlayerStats(id) {
  const d = await apiFetch('/players?fixture=' + id)
  return d.response || []
}

// Fetch injuries - 4x daily
export async function fetchInjuries() {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/injuries?league=' + id + '&season=' + CURRENT_SEASON)
      if (d.response) d.response.forEach(i => out.push({ leagueName: name, ...i }))
    } catch(err) {
      console.error('Injuries fetch error for ' + name + ':', err.message)
    }
  }
  return out
}

// Fetch odds for a fixture
export async function fetchOdds(id) {
  const d = await apiFetch('/odds?fixture=' + id)
  return d.response || []
}

// Fetch H2H for two teams
export async function fetchH2H(teamA, teamB) {
  const d = await apiFetch('/fixtures?h2h=' + teamA + '-' + teamB + '&last=10')
  return d.response || []
}

// Fetch finished results for a date
export async function fetchResults(date) {
  const out = []
  for (const [name, id] of Object.entries(LEAGUES)) {
    try {
      const d = await apiFetch('/fixtures?league=' + id + '&season=' + CURRENT_SEASON + '&date=' + date + '&status=FT')
      if (d.response) d.response.forEach(f => out.push({ leagueName: name, ...f }))
    } catch(err) {
      console.error('Results fetch error for ' + name + ':', err.message)
    }
  }
  return out
}
