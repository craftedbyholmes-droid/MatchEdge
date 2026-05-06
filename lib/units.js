// Unit scoring - position-based player ratings from lineup data
// calcPlayerRating is derived locally - no import needed from scorer

function calcPlayerRating(player, seasonStats) {
  const pos = player?.position || 'Midfielder'
  const base = { Goalkeeper: 55, Defender: 55, Midfielder: 58, Attacker: 62 }
  let rating = base[pos] || 55
  if (seasonStats) {
    if (seasonStats.goals_per_90 > 0.5) rating += 8
    else if (seasonStats.goals_per_90 > 0.3) rating += 4
    if (seasonStats.cards_per_90 > 1.5) rating -= 5
    if (seasonStats.appearances > 20) rating += 3
  }
  return Math.min(95, Math.max(40, rating))
}

export function buildUnits(lineup, teamSide) {
  const players = (lineup || []).map(p => ({
    id:       p.player?.id,
    name:     p.player?.name,
    position: p.position,
    rating:   calcPlayerRating(p, null)
  }))

  const byPos = {
    Goalkeeper: players.filter(p => p.position === 'Goalkeeper'),
    Defender:   players.filter(p => p.position === 'Defender'),
    Midfielder: players.filter(p => p.position === 'Midfielder'),
    Attacker:   players.filter(p => p.position === 'Attacker')
  }

  const avg = (arr) => arr.length ? arr.reduce((s, p) => s + p.rating, 0) / arr.length : 50

  return {
    team: teamSide,
    players,
    defensive_block: Math.round((avg(byPos.Goalkeeper) * 0.3 + avg(byPos.Defender) * 0.7) * 10) / 10,
    midfield:        Math.round(avg(byPos.Midfielder) * 10) / 10,
    attack:          Math.round(avg(byPos.Attacker) * 10) / 10,
    overall:         Math.round(avg(players) * 10) / 10,
    by_position:     byPos
  }
}