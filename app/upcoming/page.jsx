'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import Link from 'next/link'

export default function UpcomingPage() {
  const { plan } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  // Group matches by date
  const byDate = matches.reduce((acc, m) => {
    const date = m.kickoff_time ? m.kickoff_time.split('T')[0] : 'TBC'
    if (!acc[date]) acc[date] = []
    acc[date].push(m)
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  function formatDate(dateStr) {
    if (dateStr === today) return 'Today'
    if (dateStr === tomorrow) return 'Tomorrow'
    const d = new Date(dateStr + 'T12:00:00Z')
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatKickoff(kickoff_time) {
    if (!kickoff_time) return 'TBC'
    return new Date(kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function getConfBadge(score) {
    if (!score) return null
    const top = Math.max(score.total_home || 0, score.total_away || 0)
    if (top >= 80) return { label: 'BEST BET', colour: '#f0c040' }
    if (top >= 75) return { label: 'HIGH CONF', colour: '#22c55e' }
    return null
  }

  if (plan === 'free') {
    return (
      <div style={{ paddingBottom: '60px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Early bird engine scores for upcoming matches.</p>
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Engine scores update as lineups and injuries are confirmed. Get in early for best odds.</p>
      </div>

      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Scores are provisional until lineups confirmed. Higher scores = stronger signal.
      </div>

      {loading ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading upcoming fixtures...</div>
      ) : dates.length === 0 ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>
          No upcoming fixtures loaded yet.<br />
          <span style={{ fontSize: '13px', marginTop: '8px', display: 'block' }}>Use the Admin panel to fetch fixtures for upcoming dates.</span>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#e8e8f0' }}>{formatDate(date)}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{date}</div>
              <div style={{ fontSize: '12px', color: '#4b5563', background: '#1c1c28', padding: '2px 8px', borderRadius: '10px' }}>{byDate[date].length} {byDate[date].length === 1 ? 'match' : 'matches'}</div>
            </div>

            {byDate[date].map(match => {
              const homeScore = match.score?.total_home || 0
              const awayScore = match.score?.total_away || 0
              const topScore = Math.max(homeScore, awayScore)
              const favourite = homeScore >= awayScore ? match.home_team : match.away_team
              const favScore = Math.max(homeScore, awayScore)
              const badge = getConfBadge(match.score)
              const isOpen = expanded[match.fixture_id]

              return (
                <div key={match.fixture_id} style={{ background: '#13131a', border: '1px solid ' + (badge ? (badge.colour + '40') : '#2a2a3a'), borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                  <div onClick={() => toggle(match.fixture_id)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>vs</span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{match.league}</span>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>{formatKickoff(match.kickoff_time)}</span>
                        {match.score_state > 1 && <span style={{ fontSize: '10px', color: '#185FA5', background: '#185FA520', padding: '1px 6px', borderRadius: '8px' }}>State {match.score_state}/6</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                      {topScore > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: badge ? badge.colour : '#9ca3af' }}>{Math.round(topScore)}</div>
                          <div style={{ fontSize: '10px', color: '#4b5563' }}>score</div>
                        </div>
                      )}
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid #2a2a3a', padding: '14px 16px' }}>
                      {match.score ? (
                        <>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>HOME ENGINE SCORE</div>
                              <div style={{ fontSize: '24px', fontWeight: 900, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>{match.home_team}</div>
                            </div>
                            <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>AWAY ENGINE SCORE</div>
                              <div style={{ fontSize: '24px', fontWeight: 900, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>{match.away_team}</div>
                            </div>
                          </div>
                          <div style={{ background: '#1c1c28', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>EARLY SIGNAL</div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>
                              <span style={{ color: homeScore > awayScore ? '#22c55e' : '#4d9fff' }}>{favourite}</span>
                              <span style={{ color: '#6b7280', fontWeight: 400 }}> holding edge — score {Math.round(favScore)}/100</span>
                            </div>
                            {match.score.momentum_direction && (
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Momentum: <span style={{ color: '#9ca3af' }}>{match.score.momentum_direction === 'home' ? match.home_team : match.away_team}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '10px' }}>
                            Score will update as injuries, projected lineups and confirmed lineups are loaded.
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
                          Engine score not yet calculated for this fixture.
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'].map(name => (
                          <a key={name} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1c1c28', border: '1px solid #2a2a3a', color: '#9ca3af', padding: '5px 12px', borderRadius: '4px', fontSize: '12px' }}>{name}</a>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        Provisional scores only. Past performance is not a guarantee of future results.<br />
        18+ only. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133
      </div>
    </div>
  )
}