const API_BASE = 'https://api.soccerdataapi.com'
const API_KEY = process.env.SOCCER_DATA_API_KEY
const SD_HEADERS = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' }

async function sdFetch(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = API_BASE + endpoint + sep + 'auth_token=' + API_KEY
  const res = await fetch(url, { method: 'GET', headers: SD_HEADERS })
  if (!res.ok) throw new Error('SoccerData ' + res.status + ' ' + endpoint)
  return res.json()
}

// ── LEAGUE REGISTRY ─────────────────────────────────────────
// All leagues we actively fetch and score
// country field must match API country.name exactly (lowercase)
export const COVERED_LEAGUES = [
  { sd_id: 228, name: 'Premier League',   country: 'england',  code: 'EPL', tier: 1, display_name: 'English Premier League' },
  { sd_id: 229, name: 'Championship',     country: 'england',  code: 'CH',  tier: 2 },
  { sd_id: 231, name: 'League One',       country: 'england',  code: 'L1E', tier: 3 },
  { sd_id: 232, name: 'League Two',       country: 'england',  code: 'L2E', tier: 4 },
  { sd_id: 230, name: 'FA Cup',           country: 'england',  code: 'FAC', tier: 0 },
  { sd_id: 237, name: 'League Cup',       country: 'england',  code: 'LC',  tier: 0 },
  { sd_id: 289, name: 'Premiership',      country: 'scotland', code: 'SPL', tier: 1, display_name: 'Scottish Premiership' },
  { sd_id: 290, name: 'Championship',     country: 'scotland', code: 'SCH', tier: 2 },
  { sd_id: 291, name: 'FA Cup',           country: 'scotland', code: 'SFAC',tier: 0 },
  { sd_id: 241, name: 'Bundesliga',       country: 'germany',  code: 'BL',  tier: 1 },
  { sd_id: 242, name: '2. Bundesliga',    country: 'germany',  code: 'BL2', tier: 2 },
  { sd_id: 243, name: 'DFB Pokal',        country: 'germany',  code: 'DFBP',tier: 0 },
  { sd_id: 297, name: 'La Liga',          country: 'spain',    code: 'LL',  tier: 1 },
  { sd_id: 298, name: 'Segunda Division', country: 'spain',    code: 'LL2', tier: 2 },
  { sd_id: 299, name: 'Copa del Rey',     country: 'spain',    code: 'CDR', tier: 0 },
  { sd_id: 235, name: 'Ligue 1',          country: 'france',   code: 'L1F', tier: 1 },
  { sd_id: 236, name: 'Ligue 2',          country: 'france',   code: 'L2F', tier: 2 },
  { sd_id: 238, name: 'Coupe de France',  country: 'france',   code: 'CDF', tier: 0 },
  { sd_id: 253, name: 'Serie A',          country: 'italy',    code: 'SA',  tier: 1 },
  { sd_id: 254, name: 'Serie B',          country: 'italy',    code: 'SB',  tier: 2 },
  { sd_id: 255, name: 'Coppa Italia',     country: 'italy',    code: 'CI',  tier: 0 },
  { sd_id: 310, name: 'UEFA Champions League',    country: 'europe', code: 'UCL',  tier: 0 },
  { sd_id: 326, name: 'UEFA Europa League',       country: 'europe', code: 'UEL',  tier: 0 },
  { sd_id: 198, name: 'Europa Conference League', country: 'europe', code: 'ECL',  tier: 0 },
  { sd_id: 313, name: 'FIFA World Cup',           country: 'world',  code: 'WC',   tier: 0 },
  { sd_id: 323, name: 'UEFA European Championship', country: 'europe', code: 'EURO', tier: 0 },
  { sd_id: 319, name: 'UEFA WC Qualification',    country: 'europe', code: 'UEFAQ',tier: 0 },
  { sd_id: 321, name: 'CONMEBOL WC Qualification',country: 'world',  code: 'CONQ', tier: 0 },
  { sd_id: 318, name: 'CONCACAF WC Qualification',country: 'world',  code: 'CONCQ',tier: 0 },
  { sd_id: 317, name: 'AFC WC Qualification',     country: 'world',  code: 'AFCQ', tier: 0 },
  { sd_id: 316, name: 'CAF WC Qualification',     country: 'world',  code: 'CAFQ', tier: 0 }
]

// Leagues accessible on Pro plan (English only) and Edge (all)
export const PRO_LEAGUE_IDS = [228, 289, 241, 297, 235, 253]
export const EDGE_LEAGUE_IDS = COVERED_LEAGUES.map(l => l.sd_id)

export function getLeagueMeta(sdId) {
  return COVERED_LEAGUES.find(l => l.sd_id === sdId) || null
}

export function isCoveredLeague(leagueName, countryName) {
  return COVERED_LEAGUES.some(
    l => l.name === leagueName && l.country === (countryName || '').toLowerCase()
  )
}

// ── DATE HELPERS ────────────────────────────────────────────
export function sdDateToISO(date, time) {
  if (!date) return null
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
  return time ? iso + 'T' + time + ':00Z' : iso + 'T12:00:00Z'
}

export function isoToSdDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('T')[0].split('-')
  return d + '/' + m + '/' + y
}

// ── FIXTURES ────────────────────────────────────────────────
// Fetch all upcoming match previews across all covered leagues
export async function fetchUpcomingFixtures() {
  const data = await sdFetch('/match-previews-upcoming/')
  const results = Array.isArray(data) ? data : (data.results || [])
  const out = []
  for (const league of results) {
    const countryName = (league.country?.name || '').toLowerCase()
    if (countryName === 'scotland') console.log('[SPL_DEBUG] Scotland league found:', league.league_name, 'id:', league.league_id || league.id || 'unknown')
    const meta = COVERED_LEAGUES.find(l => l.name === league.league_name && l.country === countryName)
    if (!meta) continue
    if (meta.tier !== 1) continue
    for (const match of (league.match_previews || [])) {
      if (!match.teams?.home?.name || !match.teams?.away?.name) continue
      out.push({
        sd_match_id:      match.id,
        league_name:      meta.display_name || league.league_name,
        league_code:      meta.code,
        sd_league_id:     meta.sd_id,
        country:          league.country?.name || '',
        date:             match.date,
        time:             match.time,
        kickoff_iso:      sdDateToISO(match.date, match.time),
        home_team:        match.teams.home.name,
        away_team:        match.teams.away.name,
        home_team_id:     match.teams.home.id,
        away_team_id:     match.teams.away.id,
        excitement_rating:match.excitement_rating || null
      })
    }
  }
  return out
}

// Fetch upcoming for a single league
export async function fetchUpcomingByLeague(sdLeagueId) {
  try {
    const data = await sdFetch('/match-previews-upcoming/')
    const results = Array.isArray(data) ? data : (data.results || [])
    const meta = getLeagueMeta(sdLeagueId)
    const league = results.find(l => {
      const c = (l.country?.name || '').toLowerCase()
      return l.league_name === meta?.name && c === meta?.country
    })
    if (!league) return []
    return (league.match_previews || []).filter(m => m.teams?.home?.name && m.teams?.away?.name).map(m => ({
      sd_match_id:   m.id,
      league_name:   league.league_name,
      league_code:   meta?.code || '',
      sd_league_id:  sdLeagueId,
      country:       league.country?.name || '',
      date:          m.date,
      time:          m.time,
      kickoff_iso:   sdDateToISO(m.date, m.time),
      home_team:     m.teams.home.name,
      away_team:     m.teams.away.name,
      home_team_id:  m.teams.home.id,
      away_team_id:  m.teams.away.id,
      excitement_rating: m.excitement_rating || null
    }))
  } catch(err) { console.error('fetchUpcomingByLeague:', err.message); return [] }
}

// ── MATCH DETAIL ────────────────────────────────────────────
// Full match object: lineups, bench, sidelined, odds, goals, events
export async function fetchMatch(sdMatchId) {
  try {
    const d = await sdFetch('/match/?match_id=' + sdMatchId)
    return {
      id:             d.id,
      date:           d.date,
      time:           d.time,
      status:         d.status,
      minute:         d.minute,
      stage:          d.stage,
      home_team:      d.teams?.home,
      away_team:      d.teams?.away,
      stadium:        d.stadium,
      // Goals
      home_ht_goals:  d.goals?.home_ht_goals ?? null,
      away_ht_goals:  d.goals?.away_ht_goals ?? null,
      home_ft_goals:  d.goals?.home_ft_goals ?? null,
      away_ft_goals:  d.goals?.away_ft_goals ?? null,
      home_et_goals:  d.goals?.home_et_goals >= 0 ? d.goals.home_et_goals : null,
      away_et_goals:  d.goals?.away_et_goals >= 0 ? d.goals.away_et_goals : null,
      home_pen_goals: d.goals?.home_pen_goals >= 0 ? d.goals.home_pen_goals : null,
      away_pen_goals: d.goals?.away_pen_goals >= 0 ? d.goals.away_pen_goals : null,
      has_extra_time: d.has_extra_time,
      has_penalties:  d.has_penalties,
      winner:         d.winner,
      // Events: goals, cards, subs - empty pre-match, populated during/post
      events:         d.events || [],
      // Lineups
      lineup_type:    d.lineups?.lineup_type || null,
      home_lineup:    d.lineups?.lineups?.home || [],
      away_lineup:    d.lineups?.lineups?.away || [],
      home_bench:     d.lineups?.bench?.home || [],
      away_bench:     d.lineups?.bench?.away || [],
      home_sidelined: d.lineups?.sidelined?.home || [],
      away_sidelined: d.lineups?.sidelined?.away || [],
      formation_home: d.lineups?.formation?.home || null,
      formation_away: d.lineups?.formation?.away || null,
      // Odds
      odds_home_win:  d.odds?.match_winner?.home || null,
      odds_draw:      d.odds?.match_winner?.draw || null,
      odds_away_win:  d.odds?.match_winner?.away || null,
      odds_ou_line:   d.odds?.over_under?.total || 2.5,
      odds_over:      d.odds?.over_under?.over || null,
      odds_under:     d.odds?.over_under?.under || null,
      odds_hcap:      d.odds?.handicap?.market || null,
      odds_hcap_home: d.odds?.handicap?.home || null,
      odds_hcap_away: d.odds?.handicap?.away || null,
      odds_updated:   d.odds?.last_modified_timestamp || null,
      // Preview
      has_preview:    d.match_preview?.has_preview || false,
      excitement:     d.match_preview?.excitement_rating || null,
      // Raw for anything else
      _raw: d
    }
  } catch(err) { console.error('fetchMatch', sdMatchId, err.message); return null }
}

// ── MATCH PREVIEW ───────────────────────────────────────────
// AI preview text and prediction - separate endpoint
export async function fetchMatchPreview(sdMatchId) {
  try {
    const d = await sdFetch('/match-preview/?match_id=' + sdMatchId)
    return {
      match_id:       sdMatchId,
      has_preview:    d.has_preview || false,
      excitement:     d.excitement_rating || null,
      prediction:     d.match_data?.prediction || null,
      preview_text:   d.match_data?.preview || null,
      weather:        d.match_data?.weather || null,
      _raw: d
    }
  } catch(err) { console.error('fetchMatchPreview', sdMatchId, err.message); return null }
}

// ── STANDINGS ────────────────────────────────────────────────
// Returns array of team standing objects with all stats we need for scoring
export async function fetchStandings(sdLeagueId) {
  try {
    const d = await sdFetch('/standing/?league_id=' + sdLeagueId)
    const stages = d.stage || []
    const out = []
    for (const stage of stages) {
      for (const row of (stage.standings || [])) {
        out.push({
          league_id:    sdLeagueId,
          stage_name:   stage.name,
          position:     row.position,
          team_id:      row.team_id,
          team_name:    row.team_name,
          games_played: row.games_played,
          points:       row.points,
          wins:         row.wins,
          draws:        row.draws,
          losses:       row.losses,
          goals_for:    row.goals_for,
          goals_against:row.goals_against,
          goal_diff:    (row.goals_for || 0) - (row.goals_against || 0),
          form:         row.form || null,
          position_attr:row.position_attribute || null
        })
      }
    }
    return out
  } catch(err) { console.error('fetchStandings', sdLeagueId, err.message); return [] }
}

// ── HEAD TO HEAD ─────────────────────────────────────────────
export async function fetchH2H(teamAId, teamBId) {
  try {
    const d = await sdFetch('/head-to-head/?team_1_id=' + teamAId + '&team_2_id=' + teamBId)
    return {
      team_a_id:    teamAId,
      team_b_id:    teamBId,
      overall:      d.stats?.overall || null,
      home_record:  d.stats?.team1_at_home || null,
      away_record:  d.stats?.team1_at_away || null,
      last_matches: d.last_matches || [],
      _raw: d
    }
  } catch(err) { console.error('fetchH2H', teamAId, teamBId, err.message); return null }
}

// ── TRANSFERS ────────────────────────────────────────────────
// Used to calculate new signing adaptation multipliers
export async function fetchTransfers(teamId) {
  try {
    const d = await sdFetch('/transfers/?team_id=' + teamId)
    const cutoff = new Date(Date.now() - 365 * 86400000)
    function parseTransferDate(str) {
      if (!str) return null
      const parts = str.split('-')
      if (parts.length !== 3) return null
      return new Date(parts[2] + '-' + parts[1] + '-' + parts[0])
    }
    const recentIn = (d.transfers?.transfers_in || []).filter(t => {
      const dt = parseTransferDate(t.transfer_date)
      return dt && dt > cutoff
    }).map(t => ({
      player_id:    t.player_id,
      player_name:  t.player_name,
      from_team:    t.from_team?.name,
      from_team_id: t.from_team?.id,
      date:         t.transfer_date,
      type:         t.transfer_type,
      fee_eur:      t.transfer_amount || 0,
      days_since:   Math.floor((Date.now() - parseTransferDate(t.transfer_date)) / 86400000)
    }))
    return { team_id: teamId, recent_transfers_in: recentIn }
  } catch(err) { console.error('fetchTransfers', teamId, err.message); return null }
}

// ── LIVE SCORES ──────────────────────────────────────────────
export async function fetchLiveScores() {
  try {
    const data = await sdFetch('/livescores/')
    const all = Array.isArray(data) ? data : []
    const out = []
    for (const league of all) {
      const countryName = (league.country?.name || '').toLowerCase()
      const meta = COVERED_LEAGUES.find(l => l.name === league.league_name && l.country === countryName)
      if (!meta) continue
      for (const match of (league.matches || [])) {
        out.push({
          sd_match_id:   match.id,
          league_id:     meta.sd_id,
          league_name:   league.league_name,
          home_team:     match.teams?.home?.name,
          away_team:     match.teams?.away?.name,
          home_team_id:  match.teams?.home?.id,
          away_team_id:  match.teams?.away?.id,
          status:        match.status,
          minute:        match.minute,
          home_goals:    match.goals?.home_ft_goals ?? 0,
          away_goals:    match.goals?.away_ft_goals ?? 0,
          home_ht_goals: match.goals?.home_ht_goals ?? null,
          away_ht_goals: match.goals?.away_ht_goals ?? null,
          events:        match.events || []
        })
      }
    }
    return out
  } catch(err) { console.error('fetchLiveScores:', err.message); return [] }
}

// ── TEAM INFO ────────────────────────────────────────────────
export async function fetchTeam(teamId) {
  try { return await sdFetch('/team/?team_id=' + teamId) }
  catch(err) { console.error('fetchTeam', teamId, err.message); return null }
}

// ── PLAYER INFO ──────────────────────────────────────────────
// Only returns id + name — no stats available from this API
export async function fetchPlayer(playerId) {
  try { return await sdFetch('/player/?player_id=' + playerId) }
  catch(err) { console.error('fetchPlayer', playerId, err.message); return null }
}

// ── EVENTS PARSER ────────────────────────────────────────────
// Parse raw events array from a finished match into structured data
// Used to build our own player stats database over time
export function parseMatchEvents(events, homeTeamId, awayTeamId) {
  const goals = [], cards = [], subs = []
  for (const e of (events || [])) {
    const side = e.team_id === homeTeamId ? 'home' : 'away'
    if (e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty') {
      goals.push({ player_id: e.player_id, player_name: e.player_name, minute: e.minute, type: e.type, side })
    } else if (e.type === 'yellow_card' || e.type === 'red_card' || e.type === 'yellow_red_card') {
      cards.push({ player_id: e.player_id, player_name: e.player_name, minute: e.minute, type: e.type, side })
    } else if (e.type === 'substitution') {
      subs.push({ player_out_id: e.player_id, player_in_id: e.player2_id, minute: e.minute, side })
    }
  }
  return { goals, cards, subs }
}

// ── PLAYER STAT AGGREGATOR ───────────────────────────────────
// Build player stat profiles from accumulated match events in our DB
// Call this from the rollup cron, not on every match
export function buildPlayerStatFromEvents(matchEvents) {
  const stats = {}
  function get(playerId, name) {
    if (!stats[playerId]) stats[playerId] = { player_id: playerId, player_name: name, goals: 0, own_goals: 0, penalties: 0, yellow_cards: 0, red_cards: 0, subs_on: 0, subs_off: 0, appearances: 0 }
    return stats[playerId]
  }
  for (const e of (matchEvents.goals || [])) { const s = get(e.player_id, e.player_name); if (e.type === 'own_goal') s.own_goals++; else if (e.type === 'penalty') s.penalties++; else s.goals++ }
  for (const e of (matchEvents.cards || [])) { const s = get(e.player_id, e.player_name); if (e.type === 'yellow_card') s.yellow_cards++; else if (e.type.includes('red')) s.red_cards++ }
  for (const e of (matchEvents.subs || [])) { if (e.player_out_id) get(e.player_out_id, '').subs_off++; if (e.player_in_id) get(e.player_in_id, '').subs_on++ }
  return Object.values(stats)
}

// ── ADAPTATION MULTIPLIER ────────────────────────────────────
// Calculate how much to discount a new signing based on days since transfer
// Decays from 0.65 at transfer to 1.0 at 90 days
export function calcAdaptationMultiplier(daysSinceTransfer) {
  if (!daysSinceTransfer || daysSinceTransfer >= 90) return 1.0
  const progress = daysSinceTransfer / 90
  return Math.round((0.65 + (0.35 * progress)) * 100) / 100
}