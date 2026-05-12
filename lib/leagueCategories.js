export const DOMESTIC_LEAGUE_IDS = [228, 229, 231, 232, 241, 242, 244, 253, 254, 235, 236, 297, 298, 289, 290]
export const DOMESTIC_CUP_IDS    = [230, 237, 243, 255, 238, 291, 299]
export const EUROPEAN_IDS        = [310, 326, 198]
export const INTERNATIONAL_IDS   = [313, 314, 315, 317, 318, 319, 320, 321, 322, 323]

export const TOP_LEAGUE_IDS = [228, 241, 253, 235, 297, 289]

// These must match exactly what SoccerData returns in the league field
export const TOP_LEAGUE_NAMES = ['English Premier League', 'Bundesliga', 'Serie A', 'Ligue 1', 'La Liga', 'Scottish Premiership']

// Map from SoccerData league names to display names
export const LEAGUE_DISPLAY_NAMES = {
  'Premier League':    'English Premier League',
  'Premiership':       'Scottish Premiership',
  'Bundesliga':        'Bundesliga',
  'La Liga':           'La Liga',
  'Ligue 1':           'Ligue 1',
  'Serie A':           'Serie A',
  'Championship':      'English Championship',
  'League One':        'English League One',
  'League Two':        'English League Two',
  'FA Cup':            'FA Cup',
  'League Cup':        'EFL League Cup',
  'DFB Pokal':         'DFB Pokal',
  'Coppa Italia':      'Coppa Italia',
  'Coupe de France':   'Coupe de France',
  'Copa del Rey':      'Copa del Rey',
  'Scottish Cup':      'Scottish Cup',
  'Champions League':  'UEFA Champions League',
  'Europa League':     'UEFA Europa League',
  'Conference League': 'UEFA Conference League',
  'World Cup':         'FIFA World Cup'
}

export function getDisplayName(league) {
  if (!league) return league
  return LEAGUE_DISPLAY_NAMES[league] || league
}

export function getCategory(sdLeagueId) {
  if (!sdLeagueId) return 'top_leagues'
  if (TOP_LEAGUE_IDS.includes(sdLeagueId))      return 'top_leagues'
  if (DOMESTIC_LEAGUE_IDS.includes(sdLeagueId)) return 'top_leagues'
  if (DOMESTIC_CUP_IDS.includes(sdLeagueId))    return 'domestic_cups'
  if (EUROPEAN_IDS.includes(sdLeagueId))        return 'european'
  if (INTERNATIONAL_IDS.includes(sdLeagueId))   return 'international'
  return 'top_leagues'
}