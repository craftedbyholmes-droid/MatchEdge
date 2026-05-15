'use client'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

const LEAGUE_ORDER = [
  'All',
  'English Premier League',
  'Scottish Premiership',
  'Bundesliga',
  'La Liga',
  'Ligue 1',
  'Serie A',
  '2. Bundesliga',
  'Ligue 2',
  'Segunda Division',
  'Serie B',
  'Other'
]

export default function ResultsPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState({})
  const [activeLeague, setActiveLeague] = useState('All')

  useEffect(() => {
    fetch('/api/results/model').then(r => r.json()).then(d => {
      const arr = (Array.isArray(d) ? d : []).filter(m => m.home_team && m.away_team && m.home_team !== 'None')
      setMatches(arr)
      setLoading(false)
      const m = new Date().toISOString().substring(0, 7)
      setExpandedMonths({ [m]: true })
    }).catch(() => setLoading(false))
  }, [])

  function toggleMonth(m) { setExpandedMonths(e => ({ ...e, [m]: !e[m] })) }

  function isCorrect(match) {
    if (match.home_score === null) return null
    const pred   = match.score?.total_home > match.score?.total_away ? 'home' : match.score?.total_away > match.score?.total_home ? 'away' : 'draw'
    const actual = match.home_score > match.away_score ? 'home' : match.away_score > match.home_score ? 'away' : 'draw'
    return pred === actual
  }

  // Get unique leagues present in data
  const leaguesInData = ['All', ...[...new Set(matches.map(m => m.league).filter(Boolean))].sort((a, b) => {
    const ai = LEAGUE_ORDER.indexOf(a)
    const bi = LEAGUE_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })]

  const filtered = activeLeague === 'All' ? matches : matches.filter(m => m.league === activeLeague)

  // Stats for current filter
  const scored  = filtered.filter(m => m.score && m.home_score !== null)
  const correct = scored.filter(m => isCorrect(m) === true)
  const acc     = scored.length > 0 ? Math.round(correct.length / scored.length * 100) : 0
  const accColour = acc >= 60 ? '#00C896' : acc >= 50 ? '#F0B90B' : '#ef4444'

  // Group filtered matches by month > date
  const grouped = {}
  for (const m of filtered) {
    const d = m.kickoff_time?.split('T')[0]
    if (!d) continue
    const month = d.substring(0, 7)
    if (!grouped[month]) grouped[month] = {}
    if (!grouped[month][d]) grouped[month][d] = []
    grouped[month][d].push(m)
  }
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  function fmtMonthLabel(m) {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  function fmtDate(d) {
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Per-league accuracy for the summary row
  function leagueAcc(league) {
    const lMatches = matches.filter(m => m.league === league && m.score && m.home_score !== null)
    if (!lMatches.length) return null
    const lCorrect = lMatches.filter(m => isCorrect(m) === true).length
    return Math.round(lCorrect / lMatches.length * 100)
  }

  return (
    <div className='me-page'>
      <h1 className='me-title' style={{ marginBottom: '4px' }}>Model Results</h1>
      <p className='me-muted' style={{ marginBottom: '20px' }}>Engine prediction accuracy across all scored matches.</p>

      {/* Stats */}
      <div className='me-grid-3' style={{ marginBottom: '20px' }}>
        <div className='me-stat'>
          <div className='me-stat-value'>{scored.length}</div>
          <div className='me-stat-label'>{activeLeague === 'All' ? 'Scored Matches' : activeLeague}</div>
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

      {/* Per-league accuracy summary - only shown on All tab */}
      {activeLeague === 'All' && !loading && (
        <div className='me-card' style={{ marginBottom: '20px' }}>
          <div className='me-label' style={{ marginBottom: '10px' }}>Accuracy by League</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {leaguesInData.filter(l => l !== 'All').map(league => {
              const la = leagueAcc(league)
              if (la === null) return null
              const lScored = matches.filter(m => m.league === league && m.score && m.home_score !== null).length
              const laColour = la >= 60 ? '#00C896' : la >= 50 ? '#F0B90B' : '#ef4444'
              return (
                <div key={league} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveLeague(league)}>
                  <div style={{ fontSize: '13px', flex: 1, color: '#E6EDF3' }}>{league}</div>
                  <div style={{ fontSize: '11px', color: '#484F58', width: '60px', textAlign: 'right' }}>{lScored} matches</div>
                  <div style={{ width: '120px', height: '6px', background: '#1E2530', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: la + '%', background: laColour, borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: laColour, width: '36px', textAlign: 'right' }}>{la}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* League filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {leaguesInData.map(league => (
          <button
            key={league}
            onClick={() => setActiveLeague(league)}
            className='me-btn'
            style={{
              background:   activeLeague === league ? '#00C896' : undefined,
              color:        activeLeague === league ? '#0B0E11' : undefined,
              borderColor:  activeLeague === league ? '#00C896' : undefined,
              fontSize:     '12px',
              padding:      '6px 12px'
            }}
          >
            {league}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner message='Loading results...' /> : months.length === 0 ? (
        <div className='me-card' style={{ textAlign: 'center', padding: '40px' }}>
          <div className='me-sub'>No completed matches{activeLeague !== 'All' ? ' for ' + activeLeague : ''} yet.</div>
        </div>
      ) : months.map(month => (
        <div key={month} style={{ marginBottom: '24px' }}>
          {/* Month header */}
          <div onClick={() => toggleMonth(month)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '2px solid #2A3441', marginBottom: '14px' }}>
            <div style={{ fontSize: '17px', fontWeight: 800 }}>{fmtMonthLabel(month)}</div>
            <span className='me-muted'>{expandedMonths[month] ? '▲' : '▼'}</span>
          </div>

          {expandedMonths[month] && Object.keys(grouped[month]).sort((a, b) => b.localeCompare(a)).map(date => {
            const dayMatches = grouped[month][date]
            const dayScored  = dayMatches.filter(m => m.home_score !== null)
            const dayCorrect = dayScored.filter(m => isCorrect(m) === true).length
            return (
              <div key={date} style={{ marginBottom: '20px' }}>
                {/* Date header with day accuracy */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#8B949E' }}>{fmtDate(date)}</div>
                  {dayScored.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#484F58' }}>
                      {dayCorrect}/{dayScored.length} correct
                    </div>
                  )}
                </div>

                {dayMatches.map(match => {
                  const hasResult  = match.home_score !== null
                  const correct    = hasResult ? isCorrect(match) : null
                  const pred       = match.score?.total_home > match.score?.total_away ? 'home' : match.score?.total_away > match.score?.total_home ? 'away' : 'draw'
                  const predTeam   = pred === 'home' ? match.home_team : pred === 'away' ? match.away_team : 'Draw'
                  const borderColour = !hasResult ? '#2A3441' : correct ? '#00C896' : '#ef4444'

                  return (
                    <div key={match.fixture_id} style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderLeft: '4px solid ' + borderColour, borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {match.home_team} vs {match.away_team}
                        </div>
                        {activeLeague === 'All' && (
                          <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{match.league}</div>
                        )}
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
                          : <span className='me-badge' style={{ background: correct ? '#00C896' : '#ef4444', color: '#fff' }}>{correct ? 'CORRECT' : 'WRONG'}</span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}