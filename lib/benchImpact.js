import { calcPlayerRating } from './scorer'
import { buildUnits } from './units'

export function calcBenchImpacts(lineup, team) {
  const bench = lineup?.substitutes?.map(p => p.player) || []
  const impacts = []

  for (const player of bench) {
    const rating = calcPlayerRating(player)
    const pos = player.position
    const likelyPos = mapToUnit(pos)
    if (!likelyPos) continue

    const unitBefore = getUnitScore(lineup, likelyPos)
    const unitAfter = calcUnitAfterSub(lineup, player, likelyPos)
    const delta = unitAfter - unitBefore

    impacts.push({
      player_id: String(player.id),
      player_name: player.name,
      team,
      likely_position: likelyPos,
      unit_score_before: unitBefore,
      unit_score_after: unitAfter,
      delta: Math.round(delta * 10) / 10,
      flagged: Math.abs(delta) >= 8
    })
  }

  return impacts.sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta))
}

function mapToUnit(pos) {
  if (['ST','CF'].includes(pos)) return 'st_am_link'
  if (['AM','CAM'].includes(pos)) return 'st_am_link'
  if (['LW','RW'].includes(pos)) return 'winger_pull'
  if (['CM','DM'].includes(pos)) return 'cm_runner'
  if (['CB'].includes(pos)) return 'def_block'
  if (['LB','RB'].includes(pos)) return 'wide_cover'
  if (pos === 'GK') return 'def_block'
  return null
}

function getUnitScore(lineup, unitType) {
  const units = buildUnits(lineup)
  return units[unitType] || 50
}

function calcUnitAfterSub(lineup, subPlayer, unitType) {
  const subRating = calcPlayerRating(subPlayer)
  const currentScore = getUnitScore(lineup, unitType)
  return Math.round(((currentScore * 2 + subRating) / 3) * 10) / 10
}