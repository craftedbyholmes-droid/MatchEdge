// MatchEdge Competition Registry
// All SoccerData league IDs verified from API response

export const COMPETITIONS = {

  domestic_leagues: {
    label: 'Domestic Leagues',
    competitions: [
      { id: 228, name: 'Premier League',  country: 'england', code: 'EPL', tier: 1, colour: '#3d195b' },
      { id: 229, name: 'Championship',    country: 'england', code: 'CH',  tier: 2, colour: '#3d195b' },
      { id: 231, name: 'League One',      country: 'england', code: 'L1',  tier: 3, colour: '#3d195b' },
      { id: 232, name: 'League Two',      country: 'england', code: 'L2',  tier: 4, colour: '#3d195b' },
      { id: 289, name: 'Premiership',     country: 'scotland', code: 'SPL', tier: 1, colour: '#005EB8' },
      { id: 290, name: 'Championship',    country: 'scotland', code: 'SCH', tier: 2, colour: '#005EB8' },
      { id: 241, name: 'Bundesliga',      country: 'germany', code: 'BL',  tier: 1, colour: '#d00' },
      { id: 242, name: '2. Bundesliga',   country: 'germany', code: 'BL2', tier: 2, colour: '#d00' },
      { id: 244, name: '3. Liga',         country: 'germany', code: 'BL3', tier: 3, colour: '#d00' },
      { id: 297, name: 'La Liga',         country: 'spain',   code: 'LL',  tier: 1, colour: '#c60' },
      { id: 298, name: 'Segunda Division',country: 'spain',   code: 'LL2', tier: 2, colour: '#c60' },
      { id: 235, name: 'Ligue 1',         country: 'france',  code: 'L1F', tier: 1, colour: '#004494' },
      { id: 236, name: 'Ligue 2',         country: 'france',  code: 'L2F', tier: 2, colour: '#004494' },
      { id: 253, name: 'Serie A',         country: 'italy',   code: 'SA',  tier: 1, colour: '#0066cc' },
      { id: 254, name: 'Serie B',         country: 'italy',   code: 'SB',  tier: 2, colour: '#0066cc' }
    ]
  },

  domestic_cups: {
    label: 'Domestic Cups',
    competitions: [
      { id: 230, name: 'FA Cup',          country: 'england', code: 'FAC', colour: '#3d195b' },
      { id: 237, name: 'League Cup',      country: 'england', code: 'LC',  colour: '#3d195b' },
      { id: 291, name: 'FA Cup',          country: 'scotland', code: 'SFAC', colour: '#005EB8' },
      { id: 243, name: 'DFB Pokal',       country: 'germany', code: 'DFBP', colour: '#d00' },
      { id: 299, name: 'Copa del Rey',    country: 'spain',   code: 'CDR', colour: '#c60' },
      { id: 238, name: 'Coupe de France', country: 'france',  code: 'CDF', colour: '#004494' },
      { id: 255, name: 'Coppa Italia',    country: 'italy',   code: 'CI',  colour: '#0066cc' }
    ]
  },

  european: {
    label: 'European Club Competitions',
    competitions: [
      { id: 310, name: 'UEFA Champions League',     country: 'europe', code: 'UCL', colour: '#001D6C' },
      { id: 326, name: 'UEFA Europa League',        country: 'europe', code: 'UEL', colour: '#FF6900' },
      { id: 198, name: 'Europa Conference League',  country: 'europe', code: 'ECL', colour: '#00A86B' }
    ]
  },

  international_tournaments: {
    label: 'International Tournaments',
    competitions: [
      { id: 313, name: 'FIFA World Cup',              country: 'world',  code: 'WC',  colour: '#8B0000', hasGroups: true },
      { id: 323, name: 'UEFA European Championship',  country: 'europe', code: 'EURO', colour: '#003087', hasGroups: true },
      { id: 314, name: 'FIFA Club World Cup',         country: 'world',  code: 'CWC', colour: '#8B0000' },
      { id: 315, name: 'FIFA Womens World Cup',       country: 'world',  code: 'WWC', colour: '#8B0000', hasGroups: true }
    ]
  },

  qualification: {
    label: 'World Cup Qualification',
    competitions: [
      { id: 319, name: 'UEFA WC Qualification',      country: 'europe',        code: 'UEFAQ', colour: '#003087' },
      { id: 321, name: 'CONMEBOL WC Qualification',  country: 'south america', code: 'CONQ',  colour: '#006400' },
      { id: 318, name: 'CONCACAF WC Qualification',  country: 'north america', code: 'CONCQ', colour: '#8B0000' },
      { id: 317, name: 'AFC WC Qualification',       country: 'asia',          code: 'AFCQ',  colour: '#006494' },
      { id: 316, name: 'CAF WC Qualification',       country: 'africa',        code: 'CAFQ',  colour: '#8B6914' },
      { id: 320, name: 'OFC WC Qualification',       country: 'oceania',       code: 'OFCQ',  colour: '#2d6a4f' },
      { id: 322, name: 'UEFA Euro Qualification',    country: 'europe',        code: 'EUROQ', colour: '#003087' }
    ]
  }
}

// Flat list of all competitions for lookup
export const ALL_COMPETITIONS = Object.values(COMPETITIONS).flatMap(cat => cat.competitions)

// Get competition by SD league ID
export function getCompetition(sdLeagueId) {
  return ALL_COMPETITIONS.find(c => c.id === sdLeagueId) || null
}

// Country display names
export const COUNTRY_LABELS = {
  england: 'England', scotland: 'Scotland', germany: 'Germany',
  spain: 'Spain', france: 'France', italy: 'Italy',
  europe: 'Europe', world: 'World', 'south america': 'South America',
  'north america': 'North America', asia: 'Asia', africa: 'Africa', oceania: 'Oceania'
}

// Flag emojis for each country
export const COUNTRY_FLAGS = {
  england: 'EN', scotland: 'SC', germany: 'DE',
  spain: 'ES', france: 'FR', italy: 'IT',
  europe: 'EU', world: 'WC'
}