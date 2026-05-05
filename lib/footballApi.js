const API_BASE = 'https://v3.football.api-sports.io'
const API_KEY = process.env.FOOTBALL_API_KEY

async function apiFetch(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'x-apisports-key': API_KEY }
  })
  if (!res.ok) throw new Error('API-Football error: ' + res.status)
  const data = await res.json()
  if (data.errors && !Array.isArray(data.errors) && Object.keys(data.errors).length > 0) {
    throw new Error('API-Football: ' + JSON.stringify(data.errors))
  }
  return data
}

// Fetch lineup for a specific fixture by API-Football fixture ID
export async function fetchLineup(fixtureId) {
  try {
    const d = await apiFetch('/fixtures?id=' + fixtureId)
    return d.response?.[0]?.lineups || []
  } catch(err) { console.error('fetchLineup error:', err.message); return [] }
}

// Fetch player stats for a fixture
export async function fetchPlayerStats(fixtureId) {
  try {
    const d = await apiFetch('/players?fixture=' + fixtureId)
    return d.response || []
  } catch(err) { console.error('fetchPlayerStats error:', err.message); return [] }
}

// Fetch odds for a fixture
export async function fetchOdds(fixtureId) {
  try {
    const d = await apiFetch('/odds?fixture=' + fixtureId)
    return d.response || []
  } catch(err) { console.error('fetchOdds error:', err.message); return [] }
}

// Fetch injuries for a league
export async function fetchInjuries(leagueId) {
  try {
    const d = await apiFetch('/injuries?league=' + leagueId + '&season=2025')
    return d.response || []
  } catch(err) { console.error('fetchInjuries error:', err.message); return [] }
}

// Fetch live fixtures
export async function fetchLiveFixtures(leagueIds) {
  try {
    const d = await apiFetch('/fixtures?live=' + leagueIds.join('-'))
    return d.response || []
  } catch(err) { console.error('fetchLive error:', err.message); return [] }
}

// Fetch finished results by date and league
export async function fetchResults(leagueId, date) {
  try {
    const d = await apiFetch('/fixtures?league=' + leagueId + '&season=2025&date=' + date + '&status=FT')
    return d.response || []
  } catch(err) { console.error('fetchResults error:', err.message); return [] }
}

// Search for a fixture by team names and date to get AF fixture ID
export async function findFixture(leagueId, date) {
  try {
    const d = await apiFetch('/fixtures?league=' + leagueId + '&season=2025&date=' + date)
    return d.response || []
  } catch(err) { console.error('findFixture error:', err.message); return [] }
}