import { calcPlayerRating } from './scorer'

export function buildUnits(lineup, team) {
  const players = lineup?.startXI?.map(p => p.player) || []
  const formation = lineup?.formation || '4-3-3'
  const rated = players.map(p => ({ ...p, rating: calcPlayerRating(p) }))
  const byPos = (positions) => rated.filter(p => positions.includes(p.position))

  return {
    formation,
    def_block:    avg(byPos(['GK','CB','DM'])),
    dm_screen:    avg(byPos(['DM'])),
    wide_cover:   avg(byPos(['LB','RB'])),
    st_am_link:   avg(byPos(['ST','CF','AM'])),
    winger_pull:  avg(byPos(['LW','RW'])),
    cm_runner:    avg(byPos(['CM'])),
    set_piece:    avg(rated)
  }
}

function avg(players) {
  if (!players || players.length === 0) return 50
  return Math.round((players.reduce((a,p) => a + (p.rating||50), 0) / players.length) * 10) / 10
}