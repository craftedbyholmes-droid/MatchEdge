const API_BASE = 'https://api.soccerdataapi.com'
const API_KEY = process.env.SOCCER_DATA_API_KEY

async function sdFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const res = await fetch(API_BASE + endpoint + sep + 'auth_token=' + API_KEY)
  if (!res.ok) throw new Error('SoccerDataAPI error: ' + res.status + ' ' + endpoint)
  return res.json()
}

// Fetch projected lineups for today
export async function fetchProjectedLineups(dateFrom, dateTo) {
  try {
    const d = await sdFetch('/matches/?date_from=' + dateFrom + '&date_to=' + dateTo)
    return d.results || d.matches || d || []
  } catch(err) {
    console.error('SoccerDataAPI projected lineups error:', err.message)
    return []
  }
}

// Fetch a specific match
export async function fetchMatch(matchId) {
  try {
    const d = await sdFetch('/matches/' + matchId + '/')
    return d
  } catch(err) {
    console.error('SoccerDataAPI match error:', err.message)
    return null
  }
}