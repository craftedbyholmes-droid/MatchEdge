// Bench impact calculation - does any bench player materially improve a unit?
// Threshold: 8+ point improvement to flag BENCH IMPACT

function calcPlayerRating(player) {
  const pos = player?.position || 'Midfielder'
  const base = { Goalkeeper: 55, Defender: 55, Midfielder: 58, Attacker: 62 }
  return base[pos] || 55
}

export function calcBenchImpacts(homeLineup, awayLineup, homeBench, awayBench) {
  const results = []

  function checkBench(bench, lineup, team) {
    if (!bench?.length || !lineup?.length) return
    for (const benchPlayer of bench) {
      const pos = benchPlayer.position
      const startersInPos = lineup.filter(p => p.position === pos)
      if (!startersInPos.length) continue
      const avgStarterRating = startersInPos.reduce((s, p) => s + calcPlayerRating(p), 0) / startersInPos.length
      const benchRating = calcPlayerRating(benchPlayer)
      const delta = benchRating - avgStarterRating
      if (delta >= 8) {
        results.push({
          team,
          player_id:    benchPlayer.player?.id,
          player_name:  benchPlayer.player?.name,
          position:     pos,
          unit_score_before: Math.round(avgStarterRating * 10) / 10,
          unit_score_after:  Math.round(benchRating * 10) / 10,
          delta:        Math.round(delta * 10) / 10,
          flagged:      true
        })
      }
    }
  }

  checkBench(homeBench, homeLineup, 'home')
  checkBench(awayBench, awayLineup, 'away')
  return results
}