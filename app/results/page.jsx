'use client'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

const GBP = String.fromCharCode(163)

function fmt(n) {
  const v = Number(n) || 0
  if (v > 0) return { text: '+' + GBP + v.toFixed(2), colour: '#00C896' }
  if (v < 0) return { text: '-' + GBP + Math.abs(v).toFixed(2), colour: '#ef4444' }
  return { text: GBP + '0.00', colour: '#484F58' }
}

export default function ResultsPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState({})

  useEffect(() => {
    fetch('/api/results/model').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false)
      const thisMonth = new Date().toISOString().substring(0, 7)
      setExpandedMonths({ [thisMonth]: true })
    }).catch(() => setLoading(false))
  }, [])

  function toggleMonth(m) { setExpandedMonths(e => ({ ...e, [m]: !e[m] })) }

  // Group by month > day > league
  const grouped = {}
  for (const m of matches) {
    const d = m.kickoff_time?.split('T')[0]
    if (!d) continue
    const month = d.substring(0, 7)
    const league = m.league || 'Other'
    if (!grouped[month]) grouped[month] = {}
    if (!grouped[month][d]) grouped[month][d] = {}
    if (!grouped[month][d][league]) grouped[month][d][league] = []
    grouped[month][d][league].push(m)
  }
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Overall accuracy stats
  const scored = matches.filter(m => m.score && m.home_score !== null)
  const correct = scored.filter(m => {
    const pred = m.score.total_home > m.score.total_away ? 'home' : m.score.total_away > m.score.total_home ? 'away' : 'draw'
    const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw'
    return pred === actual
  })
  const acc = scored.length > 0 ? Math.round(correct.length / scored.length * 100) : 0

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Model Results</h1>
      <p style={{ color: '#484F58', fontSize: '13px', marginBottom: '20px' }}>Engine prediction accuracy on all scored matches. Tipster P+L is on the Tipsters page.</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Scored Matches', value: scored.length },
          { label: 'Correct Results', value: correct.length },
          { label: 'Accuracy', value: acc + '%', colour: acc >= 60 ? '#00C896' : acc >= 50 ? '#F0B90B' : '#ef4444' },
          { label: 'Total Matches', value: matches.length }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.colour || '#E6EDF3' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#484F58', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? <LoadingSpinner message='Loading results...' /> : months.length === 0 ? (
        <div style={{ color: '#484F58', textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
          No completed matches yet. Results appear after matches finish.
        </div>
      ) : months.map(month => {
        const [y, mo] = month.split('-')
        const monthLabel = new Date(y, mo - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        const monthMatches = Object.values(grouped[month]).flatMap(d => Object.values(d).flat())
        const monthScored = monthMatches.filter(m => m.score && m.home_score !== null)
        const monthCorrect = monthScored.filter(m => {
          const pred = m.score.total_home > m.score.total_away ? 'home' : m.score.total_away > m.score.total_home ? 'away' : 'draw'
          const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw'
          return pred === actual
        })
        const monthAcc = monthScored.length > 0 ? Math.round(monthCorrect.length / monthScored.length * 100) : 0
        return (
          <div key={month} style={{ marginBottom: '24px' }}>
            <div onClick={() => toggleMonth(month)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '2px solid #2A3441', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>{monthLabel}</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: monthAcc >= 60 ? '#00C896' : '#F0B90B' }}>{monthCorrect.length}/{monthScored.length} correct ({monthAcc}%)</span>
                <span style={{ color: '#484F58' }}>{expandedMonths[month] ? 'v' : '>'}</span>
              </div>
            </div>
            {expandedMonths[month] && Object.keys(grouped[month]).sort((a,b) => b.localeCompare(a)).map(date => {
              const dayMatches = Object.values(grouped[month][date]).flat()
              const dayScored = dayMatches.filter(m => m.home_score !== null)
              const dayCorrect = dayScored.filter(m => {
                const pred = m.score?.total_home > m.score?.total_away ? 'home' : m.score?.total_away > m.score?.total_home ? 'away' : 'draw'
                const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw'
                return pred === actual
              })
              return (
                <div key={date} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#8B949E' }}>
                      {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    {dayScored.length > 0 && <div style={{ fontSize: '12px', color: '#484F58' }}>{dayCorrect.length}/{dayScored.length} correct</div>}
                  </div>
                  {Object.entries(grouped[month][date]).sort().map(([league, lMatches]) => (
                    <div key={league} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{league}</div>
                      {lMatches.map(match => {
                        const hasResult = match.home_score !== null
                        const pred = match.score?.total_home > match.score?.total_away ? 'home' : match.score?.total_away > match.score?.total_home ? 'away' : 'draw'
                        const actual = hasResult ? (match.home_score > match.away_score ? 'home' : match.away_score > match.home_score ? 'away' : 'draw') : null
                        const isCorrect = hasResult && pred === actual
                        const border = !hasResult ? '#2A3441' : isCorrect ? '#00C89640' : '#ef444430'
                        const predTeam = pred === 'home' ? match.home_team : pred === 'away' ? match.away_team : 'Draw'
                        const gap = match.score ? Math.abs(match.score.total_home - match.score.total_away) : 0
                        return (
                          <div key={match.fixture_id} style={{ background: '#161B22', border: '1px solid ' + border, borderRadius: '8px', padding: '12px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>
                                {match.home_team} vs {match.away_team}
                              </div>
                              <div style={{ fontSize: '12px', color: '#8B949E' }}>
                                Engine: <span style={{ color: '#E6EDF3', fontWeight: 600 }}>{predTeam}</span>
                                {match.score && <span style={{ color: '#484F58', marginLeft: '6px' }}>({Math.round(match.score.total_home)} vs {Math.round(match.score.total_away)} | {Math.round(gap)}pt gap)</span>}
                              </div>
                              {hasResult && (
                                <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '2px' }}>
                                  Result: <span style={{ color: '#E6EDF3', fontWeight: 600 }}>{match.home_score} - {match.away_score}</span>
                                  <span style={{ color: '#484F58', marginLeft: '6px' }}>({match.home_score > match.away_score ? match.home_team : match.away_score > match.home_score ? match.away_team : 'Draw'} won)</span>
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {!hasResult ? (
                                <div style={{ background: '#2A3441', color: '#484F58', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>PENDING</div>
                              ) : (
                                <div style={{ background: isCorrect ? '#00C89620' : '#ef444420', color: isCorrect ? '#00C896' : '#ef4444', border: '1px solid ' + (isCorrect ? '#00C89640' : '#ef444440'), fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                  {isCorrect ? 'CORRECT' : 'WRONG'}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}