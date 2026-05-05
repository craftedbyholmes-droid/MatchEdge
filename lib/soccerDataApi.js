const API_BASE = 'https://api.soccerdataapi.com'
const API_KEY = process.env.SOCCER_DATA_API_KEY

const SD_HEADERS = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip'
}

async function sdFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = API_BASE + endpoint + sep + 'auth_token=' + API_KEY
  const res = await fetch(url, { method: 'GET', headers: SD_HEADERS })
  if (!res.ok) throw new Error('SoccerData error: ' + res.status + ' ' + endpoint)
  return res.json()
}

// Covered leagues - league_name must match SoccerData exactly
export const COVERED_LEAGUES = {
  'Premier League': { country: 'england', code: 'EPL', sd_id: 228 },
  'Bundesliga':     { country: 'germany', code: 'BL',  sd_id: 256 },
  'Serie A':        { country: 'italy',   code: 'SA',  sd_id: 262 },
  'La Liga':        { country: 'spain',   code: 'LL',  sd_id: 243 },
  'Ligue 1':        { country: 'france',  code: 'L1',  sd_id: 233 }
}

// Convert DD/MM/YYYY + HH:MM to ISO
export function sdDateToISO(date, time) {
  if (!date) return null
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
  return time ? iso + 'T' + time + ':00Z' : iso + 'T12:00:00Z'
}

// Fetch all upcoming match previews filtered to covered leagues
export async function fetchUpcomingFixtures() {
  const data = await sdFetch('/match-previews-upcoming/')
  const results = Array.isArray(data) ? data : (data.results || [])
  const out = []
  for (const league of results) {
    if (!COVERED_LEAGUES[league.league_name]) continue
    const meta = COVERED_LEAGUES[league.league_name]
    for (const match of (league.match_previews || [])) {
      if (!match.teams?.home?.name || !match.teams?.away?.name) continue
      out.push({
        sd_match_id: match.id,
        league_name: league.league_name,
        league_code: meta.code,
        sd_league_id: meta.sd_id,
        country: meta.country,
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

// Fetch full match detail - lineups, odds, goals, events, sidelined
export async function fetchMatch(matchId) {
  try {
    return await sdFetch('/match/?match_id=' + matchId)
  } catch(err) { console.error('fetchMatch error:', err.message); return null }
}

// Fetch match preview - AI content, prediction, weather, excitement
export async function fetchMatchPreview(matchId) {
  try {
    return await sdFetch('/match-preview/?match_id=' + matchId)
  } catch(err) { console.error('fetchMatchPreview error:', err.message); return null }
}

// Fetch H2H stats for two teams
export async function fetchH2H(team1Id, team2Id) {
  try {
    return await sdFetch('/head-to-head/?team_1_id=' + team1Id + '&team_2_id=' + team2Id)
  } catch(err) { console.error('fetchH2H error:', err.message); return null }
}

// Fetch league standings
export async function fetchStandings(leagueId) {
  try {
    return await sdFetch('/standing/?league_id=' + leagueId)
  } catch(err) { console.error('fetchStandings error:', err.message); return null }
}

// Fetch matches by league (current season)
export async function fetchMatchesByLeague(leagueId) {
  try {
    const data = await sdFetch('/matches/?league_id=' + leagueId)
    return Array.isArray(data) ? data : []
  } catch(err) { console.error('fetchMatchesByLeague error:', err.message); return [] }
}

// Fetch live scores
export async function fetchLiveScores() {
  try {
    const data = await sdFetch('/livescores/')
    const all = Array.isArray(data) ? data : []
    return all.filter(l => COVERED_LEAGUES[l.league_name])
  } catch(err) { console.error('fetchLiveScores error:', err.message); return [] }
}