// API Football league IDs mapping from our league names
export const AF_LEAGUE_IDS = {
  'English Premier League': 39,
  'Premier League':         39,
  'English Championship':   40,
  'Bundesliga':             78,
  'La Liga':                140,
  'Ligue 1':                61,
  'Serie A':                135,
  'Scottish Premiership':   179,
  'Premiership':            179,
  'UEFA Champions League':  2,
  'UEFA Europa League':     3,
  'UEFA Conference League': 848,
  'FA Cup':                 45,
  'DFB Pokal':              81,
  'Copa del Rey':           143,
  'Coppa Italia':           137,
  'Coupe de France':        66
}

const AF_KEY  = process.env.FOOTBALL_API_KEY
const AF_BASE = 'https://v3.football.api-sports.io'

export async function afFetch(path) {
  const res = await fetch(AF_BASE + path, {
    headers: { 'x-apisports-key': AF_KEY }
  })
  if (!res.ok) throw new Error('APIFootball ' + res.status + ': ' + path)
  const data = await res.json()
  if (data.errors && Object.keys(data.errors).length) {
    throw new Error('APIFootball errors: ' + JSON.stringify(data.errors))
  }
  return data
}

// Calculate composite player rating from season stats
export function calcPlayerRating(stats, position) {
  if (!stats) return 5.0
  const s = stats
  const pos = (position || s.games?.position || '').toUpperCase()

  // Base rating from API if available
  const baseRating = parseFloat(s.games?.rating) || 6.5

  // Position-specific modifiers
  let bonus = 0

  if (pos === 'G' || pos === 'GK' || pos.includes('GOAL')) {
    // GK: saves, clean sheet proxy
    const saveRate = s.goals?.saves ? (s.goals.saves / Math.max(1, s.goals.saves + (s.goals?.conceded || 0))) : 0.5
    bonus = (saveRate - 0.5) * 2

  } else if (pos === 'D' || pos.includes('DEF')) {
    // Defender: duels won, interceptions, blocks
    const duelWinRate = s.duels?.total ? (s.duels.won || 0) / s.duels.total : 0.5
    const tackles = (s.tackles?.total || 0) + (s.tackles?.interceptions || 0) + (s.tackles?.blocks || 0)
    const tacklesPerGame = tackles / Math.max(1, s.games?.appearences || 1)
    bonus = (duelWinRate - 0.5) * 1.5 + Math.min(tacklesPerGame / 5, 0.5)

  } else if (pos === 'M' || pos.includes('MID')) {
    // Midfielder: key passes, dribbles, duels
    const keyPassesPerGame = (s.passes?.key || 0) / Math.max(1, s.games?.appearences || 1)
    const duelWinRate = s.duels?.total ? (s.duels.won || 0) / s.duels.total : 0.5
    const dribbleRate = s.dribbles?.attempts ? (s.dribbles.success || 0) / s.dribbles.attempts : 0.5
    bonus = keyPassesPerGame * 0.3 + (duelWinRate - 0.5) + (dribbleRate - 0.5) * 0.5

  } else if (pos === 'F' || pos.includes('ATT') || pos.includes('FOR')) {
    // Attacker: goals per game, shots on target rate, assists
    const goalsPerGame = (s.goals?.total || 0) / Math.max(1, s.games?.appearences || 1)
    const shotAccuracy = s.shots?.total ? (s.shots.on || 0) / s.shots.total : 0.3
    const assistsPerGame = (s.goals?.assists || 0) / Math.max(1, s.games?.appearences || 1)
    bonus = goalsPerGame * 1.5 + (shotAccuracy - 0.3) * 2 + assistsPerGame
  }

  return Math.max(1, Math.min(10, baseRating + bonus))
}

// Calculate goalscorer probability for a player
export function calcGoalscorerProb(stats, position, minutesInMatch = 90) {
  if (!stats) return 0.05
  const pos = (position || stats.games?.position || '').toUpperCase()
  const apps = stats.games?.appearences || 1
  const minutes = stats.games?.minutes || apps * 75
  const goals = stats.goals?.total || 0
  const assists = stats.goals?.assists || 0
  const shots = stats.shots?.total || 0
  const shotsOn = stats.shots?.on || 0

  // Goals per 90
  const goalsPer90 = (goals / Math.max(1, minutes)) * 90
  const shotsPer90 = (shots / Math.max(1, minutes)) * 90
  const shotAccuracy = shots > 0 ? shotsOn / shots : 0.3

  // Base probability by position
  let baseProb = 0.03
  if (pos === 'F' || pos.includes('ATT')) baseProb = 0.18
  else if (pos === 'M' || pos.includes('MID')) baseProb = 0.07
  else if (pos === 'D' || pos.includes('DEF')) baseProb = 0.03
  else if (pos === 'G') baseProb = 0.005

  // Adjust by actual performance
  const performanceMultiplier = goalsPer90 > 0 ? (goalsPer90 / baseProb) : 1
  const shotMultiplier = shotsPer90 > 2 ? 1.2 : shotsPer90 > 1 ? 1.1 : 1.0
  const accuracyMultiplier = shotAccuracy > 0.4 ? 1.3 : shotAccuracy > 0.3 ? 1.1 : 0.9

  // Scale by minutes in match
  const minutesFactor = minutesInMatch / 90

  const finalProb = baseProb * Math.min(2.5, performanceMultiplier) * shotMultiplier * accuracyMultiplier * minutesFactor
  return Math.max(0.005, Math.min(0.95, finalProb))
}