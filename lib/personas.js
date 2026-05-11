export const PERSONAS = {
  gordon: { id: 'gordon', name: 'Gaffer Gordon', colour: '#00C896', markets: ['match_result','ht_result','double_chance'], minGap: 12, minPicks: 2, maxPicks: 4, bestPickStake: 15, standardStake: 5, bio: 'The ex-manager. Reads the game tactically.' },
  stan:   { id: 'stan',   name: 'Stats Stan',    colour: '#185FA5', markets: ['btts','over_25','asian_hcap'],              minGap: 0,  minPicks: 2, maxPicks: 5, bestPickStake: 10, standardStake: 5, bio: 'The data obsessive. Lives for BTTS and over/under.' },
  pez:    { id: 'pez',    name: 'Punter Pez',    colour: '#993C1D', markets: ['anytime_scorer','first_scorer','cards'],    minGap: 0,  minPicks: 2, maxPicks: 6, bestPickStake: 10, standardStake: 5, bio: 'The instinctive one. Player props specialist.' }
}
export function calcPnL(pick) {
  if (pick.outcome === 'void') return 0
  if (pick.outcome === 'win') return pick.stake * (pick.odds_decimal - 1)
  return -pick.stake
}