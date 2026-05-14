'use client'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ResultsPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState({})

  useEffect(() => {
    fetch('/api/results/model').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false)
      const m = new Date().toISOString().substring(0, 7)
      setExpandedMonths({ [m]: true })
    }).catch(() => setLoading(false))
  }, [])

  function toggleMonth(m) { setExpandedMonths(e => ({ ...e, [m]: !e[m] })) }

  const grouped = {}
  for (const m of matches) {
    const d = m.kickoff_time?.split('T')[0]
    if (!d) continue
    const month  = d.substring(0, 7)
    const league = m.league || 'Other'
    if (!grouped[month]) grouped[month] = {}
    if (!grouped[month][d]) grouped[month][d] = {}
    if (!grouped[month][d][league]) grouped[month][d][league] = []
    grouped[month][d][league].push(m)
  }
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const scored  = matches.filter(m => m.score && m.home_score !== null)
  const correct = scored.filter(m => {
    const pred   = m.score.total_home > m.score.total_away ? 'home' : m.score.total_away > m.score.total_home ? 'away' : 'draw'
    const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw'
    return pred === actual
  })
  const acc = scored.length > 0 ? Math.round(correct.length / scored.length * 100) : 0
  const accColour = acc >= 60 ? '#00C896' : acc >= 50 ? '#F0B90B' : '#ef4444'

  function fmtMonthLabel(m) {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  function fmtDate(d) {
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className='me-page'>
      <h1 className='me-title' style={{ marginBottom: '4px' }}>Model Results</h1>
      <p className='me-muted' style={{ marginBottom: '20px' }}>Engine prediction accuracy across all scored matches.</p>

      {/* Stats */}
      <div className='me-grid-3' style={{ marginBottom: '24px' }}>
        <div className='me-stat'>
          <div className='me-stat-value'>{scored.length}</div>
          <div className='me-stat-label'>Scored Matches</div>
        </div>
        <div className='me-stat'>
          <div className='me-stat-value'>{correct.length}</div>
          <div className='me-stat-label'>Correct</div>
        </div>
        <div className='me-stat'>
          <div className='me-stat-value' style={{ color: accColour }}>{acc}%</div>
          <div className='me-stat-label'>Accuracy</div>
        </div>
      </div>

      {loading ? <LoadingSpinner message='Loading results...' /> : months.length === 0 ? (
        <div className='me-card' style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className='me-sub'>No completed matches yet.</div>
        </div>
      ) : months.map(month => (
        <div key={month} style={{ marginBottom: '24px' }}>
          {/* Month header */}
          <div onClick={() => toggleMonth(month)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '2px solid #2A3441', marginBottom: '14px' }}>
            <div style={{ fontSize: '17px', fontWeight: 800 }}>{fmtMonthLabel(month)}</div>
            <span className='me-muted'>{expandedMonths[month] ? '▲' : '▼'}</span>
          </div>

          {expandedMonths[month] && Object.keys(grouped[month]).sort((a,b) => b.localeCompare(a)).map(date => (
            <div key={date} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8B949E', marginBottom: '10px' }}>{fmtDate(date)}</div>
              {Object.entries(grouped[month][date]).sort().map(([league, lMatches]) => (
                <div key={league} style={{ marginBottom: '12px' }}>
                  <div className='me-label' style={{ marginBottom: '6px' }}>{league}</div>
                  {lMatches.map(match => {
                    const hasResult = match.home_score !== null
                    const pred   = match.score?.total_home > match.score?.total_away ? 'home' : match.score?.total_away > match.score?.total_home ? 'away' : 'draw'
                    const actual = hasResult ? (match.home_score > match.away_score ? 'home' : match.away_score > match.home_score ? 'away' : 'draw') : null
                    const isCorrect = hasResult && pred === actual
                    const predTeam = pred === 'home' ? match.home_team : pred === 'away' ? match.away_team : 'Draw'
                    const borderColour = !hasResult ? '#2A3441' : isCorrect ? '#00C896' : '#ef4444'
                    return (
                      <div key={match.fixture_id} style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderLeft: '4px solid ' + borderColour, borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {match.home_team} vs {match.away_team}
                          </div>
                          <div style={{ fontSize: '12px', color: '#444' }}>
                            Engine: <span style={{ fontWeight: 700, color: '#111' }}>{predTeam}</span>
                            {match.score && <span style={{ color: '#888', marginLeft: '4px' }}>({Math.round(match.score.total_home)} vs {Math.round(match.score.total_away)})</span>}
                          </div>
                          {hasResult && (
                            <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>
                              Result: <span style={{ fontWeight: 700, color: '#111' }}>{match.home_score} - {match.away_score}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {!hasResult
                            ? <span className='me-badge me-badge-grey'>PENDING</span>
                            : <span className='me-badge' style={{ background: isCorrect ? '#00C896' : '#ef4444', color: '#fff' }}>{isCorrect ? 'CORRECT' : 'WRONG'}</span>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}