// Categorise leagues by sd_league_id

export const DOMESTIC_LEAGUE_IDS = [228, 229, 231, 232, 241, 242, 244, 253, 254, 235, 236, 297, 298, 289, 290]
export const DOMESTIC_CUP_IDS    = [230, 237, 243, 255, 238, 291, 299]
export const EUROPEAN_IDS        = [310, 326, 198]
export const INTERNATIONAL_IDS   = [313, 314, 315, 317, 318, 319, 320, 321, 322, 323]

export const TOP_LEAGUE_IDS = [228, 241, 253, 235, 297, 289]

export const TOP_LEAGUE_NAMES = ['Premier League', 'Bundesliga', 'Serie A', 'Ligue 1', 'La Liga', 'Premiership']

export function getCategory(sdLeagueId) {
  if (!sdLeagueId) return 'top_leagues'
  if (TOP_LEAGUE_IDS.includes(sdLeagueId))      return 'top_leagues'
  if (DOMESTIC_LEAGUE_IDS.includes(sdLeagueId)) return 'top_leagues'
  if (DOMESTIC_CUP_IDS.includes(sdLeagueId))    return 'domestic_cups'
  if (EUROPEAN_IDS.includes(sdLeagueId))        return 'european'
  if (INTERNATIONAL_IDS.includes(sdLeagueId))   return 'international'
  return 'top_leagues'
}