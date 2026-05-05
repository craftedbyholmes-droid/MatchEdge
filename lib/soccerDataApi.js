const API_BASE = 'https://api.soccerdataapi.com'
const API_KEY = process.env.SOCCER_DATA_API_KEY

// Leagues we cover - matches SoccerData league_name exactly
export const COVERED_LEAGUES = {
  'Premier League': { country: 'england', leagueCode: 'EPL', afLeagueId: 39 },
  'Bundesliga':     { country: 'germany', leagueCode: 'BL',  afLeagueId: 78 },
  'Serie A':        { country: 'italy',   leagueCode: 'SA',  afLeagueId: 135 },
  'La Liga':        { country: 'spain',   leagueCode: 'LL',  afLeagueId: 140 },
  'Ligue 1':        { country: 'france',  leagueCode: 'L1',  afLeagueId: 61 }
}

async function sdFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = API_BASE + endpoint + sep + 'auth_token=' + API_KEY
  const res = await fetch(url)
  if (!res.ok) throw new Error('SoccerDataAPI error: ' + res.status + ' ' + endpoint)
  return res.json()
}

// Fetch all upcoming match previews and filter to covered leagues
export async function fetchUpcomingFixtures() {
  const data = await sdFetch('/match-previews-upcoming/')
  const results = data.results || []
  const out = []
  for (const league of results) {
    if (!COVERED_LEAGUES[league.league_name]) continue
    const meta = COVERED_LEAGUES[league.league_name]
    for (const match of (league.match_previews || [])) {
      out.push({
        source: 'soccerdata',
        league_name: league.league_name,
        league_code: meta.leagueCode,
        af_league_id: meta.afLeagueId,
        country: league.country?.name || meta.country,
        match_id: match.id,
        date: match.date,
        time: match.time,
        home_team: match.teams?.home?.name,
        away_team: match.teams?.away?.name,
        home_team_id: match.teams?.home?.id,
        away_team_id: match.teams?.away?.id,
        excitement_rating: match.excitement_rating,
        word_count: match.word_count
      })
    }
  }
  return out
}

// Convert SoccerData date format DD/MM/YYYY HH:MM to ISO
export function sdDateToISO(date, time) {
  if (!date) return null
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
  return time ? iso + 'T' + time + ':00Z' : iso + 'T12:00:00Z'
}

// Fetch match preview detail for a specific match
export async function fetchMatchPreview(matchId) {
  try {
    const data = await sdFetch('/match-previews/' + matchId + '/')
    return data
  } catch(err) {
    console.error('SoccerData preview error:', err.message)
    return null
  }
}