const API_BASE = 'https://api.soccerdataapi.com'
const API_KEY = process.env.SOCCER_DATA_API_KEY
const SD_HEADERS = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' }

async function sdFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = API_BASE + endpoint + sep + 'auth_token=' + API_KEY
  const res = await fetch(url, { method: 'GET', headers: SD_HEADERS })
  if (!res.ok) throw new Error('SoccerData error: ' + res.status + ' ' + endpoint)
  return res.json()
}

// Whitelist by BOTH league name AND country - prevents Ukraine 'Premier League' contamination
export const COVERED_LEAGUES = [
  { league_name: 'Premier League', country: 'england', code: 'EPL', sd_id: 228 },
  { league_name: 'Bundesliga',     country: 'germany', code: 'BL',  sd_id: 256 },
  { league_name: 'Serie A',        country: 'italy',   code: 'SA',  sd_id: 262 },
  { league_name: 'La Liga',        country: 'spain',   code: 'LL',  sd_id: 243 },
  { league_name: 'Ligue 1',        country: 'france',  code: 'L1',  sd_id: 233 }
]

function isCoveredLeague(leagueName, countryName) {
  return COVERED_LEAGUES.some(
    l => l.league_name === leagueName && l.country === (countryName || '').toLowerCase()
  )
}

export function sdDateToISO(date, time) {
  if (!date) return null
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
  return time ? iso + 'T' + time + ':00Z' : iso + 'T12:00:00Z'
}

export async function fetchUpcomingFixtures() {
  const data = await sdFetch('/match-previews-upcoming/')
  const results = Array.isArray(data) ? data : (data.results || [])
  const out = []
  for (const league of results) {
    const countryName = league.country?.name || ''
    if (!isCoveredLeague(league.league_name, countryName)) continue
    const meta = COVERED_LEAGUES.find(l => l.league_name === league.league_name && l.country === countryName.toLowerCase())
    for (const match of (league.match_previews || [])) {
      if (!match.teams?.home?.name || !match.teams?.away?.name) continue
      out.push({
        sd_match_id: match.id,
        league_name: league.league_name,
        league_code: meta?.code || '',
        sd_league_id: meta?.sd_id || null,
        country: countryName,
        date: match.date,
        time: match.time,
        home_team: match.teams.home.name,
        away_team: match.teams.away.name,
        home_team_id: match.teams.home.id,
        away_team_id: match.teams.away.id,
        excitement_rating: match.excitement_rating || null
      })
    }
  }
  return out
}

export async function fetchMatch(matchId) {
  try { return await sdFetch('/match/?match_id=' + matchId) }
  catch(err) { console.error('fetchMatch error:', err.message); return null }
}

export async function fetchMatchPreview(matchId) {
  try { return await sdFetch('/match-preview/?match_id=' + matchId) }
  catch(err) { console.error('fetchMatchPreview error:', err.message); return null }
}

export async function fetchH2H(team1Id, team2Id) {
  try { return await sdFetch('/head-to-head/?team_1_id=' + team1Id + '&team_2_id=' + team2Id) }
  catch(err) { console.error('fetchH2H error:', err.message); return null }
}

export async function fetchStandings(leagueId) {
  try { return await sdFetch('/standing/?league_id=' + leagueId) }
  catch(err) { console.error('fetchStandings error:', err.message); return null }
}

export async function fetchLiveScores() {
  try {
    const data = await sdFetch('/livescores/')
    const all = Array.isArray(data) ? data : []
    return all.filter(l => isCoveredLeague(l.league_name, l.country?.name || ''))
  } catch(err) { console.error('fetchLiveScores error:', err.message); return [] }
}