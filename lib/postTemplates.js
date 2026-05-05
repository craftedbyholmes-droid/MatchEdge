export function generatePosts({ persona, match, selection, oddsFractional, oddsDecimal, engineScore, seasonRecord }) {
  const rec = seasonRecord || { wins: 0, total_posted: 0, profit_loss: 0 }
  const total = rec.total_posted || rec.total_picks || 0
  const wr = total > 0 ? Math.round((rec.wins / total) * 100) : 0
  const pl = (rec.profit_loss >= 0 ? '+' : '') + Number(rec.profit_loss || 0).toFixed(2)
  const short = [persona.name.toUpperCase() + ' | ' + match.league, match.home_team + ' vs ' + match.away_team, 'Pick: ' + selection + ' @ ' + oddsFractional, 'Score: ' + engineScore + '/100', 'Season: ' + rec.wins + '/' + total + ' (' + wr + '%) PL: ' + pl, '#MatchEdge'].join('\\n')
  const long = ['## ' + persona.name + ' | ' + match.home_team + ' vs ' + match.away_team, '', '**Pick:** ' + selection + ' @ ' + oddsFractional, '**Score:** ' + engineScore + '/100', '', '**Season:** ' + rec.wins + 'W/' + (total-rec.wins) + 'L | ' + wr + '% | PL: ' + pl, '', '*Please gamble responsibly. BeGambleAware.org*'].join('\\n')
  const fb = [persona.name + ' is backing ' + selection + ' in ' + match.home_team + ' vs ' + match.away_team + '.', '', 'Engine score: ' + engineScore + '/100. Odds: ' + oddsFractional + '.', 'Season: ' + rec.wins + ' wins from ' + total + ' picks. PL: ' + pl + '.', '', '#MatchEdge #Football'].join('\\n')
  return { short, bluesky: short, long, fb }
}
export function generateResultPost({ persona, match, selection, oddsFractional, outcome, finalScore, profitLoss, seasonRecord }) {
  const rec = seasonRecord || { wins: 0, total_posted: 0, profit_loss: 0 }
  const pl = (profitLoss >= 0 ? '+' : '') + Number(profitLoss).toFixed(2)
  const rpl = (rec.profit_loss >= 0 ? '+' : '') + Number(rec.profit_loss || 0).toFixed(2)
  const label = outcome === 'win' ? 'WIN' : outcome === 'void' ? 'VOID' : 'LOSS'
  const short = [label + ' | ' + persona.name.toUpperCase(), match.home_team + ' vs ' + match.away_team + ' - ' + finalScore, 'Pick: ' + selection + ' @ ' + oddsFractional + ' | ' + pl, 'Running PL: ' + rpl, '#MatchEdge'].join('\\n')
  return { short, bluesky: short }
}