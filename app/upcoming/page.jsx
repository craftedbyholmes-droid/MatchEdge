'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']
const LEAGUE_COLOURS = {
  'Bundesliga':    '#d00',
  'La Liga':       '#c60',
  'Ligue 1':       '#004494',
  'Premier League':'#3d195b',
  'Serie A':       '#0066cc'
}

export default function UpcomingPage() {
  const { plan } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [activeLeague, setActiveLeague] = useState('all')

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  // Filter to covered leagues only - exclude Ukraine etc
  const filtered = matches.filter(m => LEAGUE_ORDER.includes(m.league))

  // Group by league then by date within each league
  const byLeague = {}
  LEAGUE_ORDER.forEach(l => { byLeague[l] = [] })
  filtered.forEach(m => {
    if (byLeague[m.league]) byLeague[m.league].push(m)
  })

  // Sort each league by score descending
  LEAGUE_ORDER.forEach(l => {
    byLeague[l].sort((a, b) => {
      const aScore = Math.max(a.score?.total_home || 0, a.score?.total_away || 0)
      const bScore = Math.max(b.score?.total_home || 0, b.score?.total_away || 0)
      return bScore - aScore
    })
  })

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  function formatDate(dateStr) {
    if (!dateStr) return 'TBC'
    if (dateStr === today) return 'Today'
    if (dateStr === tomorrow) return 'Tomorrow'
    return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatKickoff(kt) {
    if (!kt) return 'TBC'
    return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function getMatchDate(kt) {
    if (!kt) return 'TBC'
    return kt.split('T')[0]
  }

  function getBadge(score) {
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
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Early bird engine scores across 5 top European leagues.</p>
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      </div>
    )
  }

  // Mobile league filter tabs
  const leagueTabs = ['all', ...LEAGUE_ORDER]

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Engine scores in score order. Get in early for best odds.</p>
      </div>

      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Scores are provisional until lineups confirmed. Updates automatically as match day approaches.
      </div>

      {/* Mobile league tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {leagueTabs.map(l => (
          <button key={l} onClick={() => setActiveLeague(l)} style={{ padding: '5px 12px', background: activeLeague === l ? (LEAGUE_COLOURS[l] || '#0F6E56') : '#1c1c28', color: '#fff', border: '1px solid ' + (activeLeague === l ? (LEAGUE_COLOURS[l] || '#0F6E56') : '#2a2a3a'), borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            {l === 'all' ? 'All Leagues' : l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading upcoming fixtures...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>
          No upcoming fixtures. Use Admin panel to fetch fixtures.
        </div>
      ) : (
        <>
          {/* Desktop: 5 columns side by side */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {LEAGUE_ORDER.filter(l => activeLeague === 'all' || activeLeague === l).map(league => (
              <div key={league} style={{ flex: '1 1 180px', minWidth: '0' }}>
                <div style={{ background: LEAGUE_COLOURS[league] || '#1c1c28', borderRadius: '6px 6px 0 0', padding: '8px 12px', marginBottom: '2px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{league}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{byLeague[league].length} matches</div>
                </div>
                {byLeague[league].length === 0 ? (
                  <div style={{ background: '#13131a', padding: '16px 12px', fontSize: '12px', color: '#4b5563', textAlign: 'center', borderRadius: '0 0 6px 6px' }}>No upcoming fixtures</div>
                ) : (
                  byLeague[league].map((match, idx) => {
                    const homeScore = match.score?.total_home || 0
                    const awayScore = match.score?.total_away || 0
                    const topScore = Math.max(homeScore, awayScore)
                    const badge = getBadge(match.score)
                    const isOpen = expanded[match.fixture_id]
                    const matchDate = getMatchDate(match.kickoff_time)
                    const isLast = idx === byLeague[league].length - 1
                    return (
                      <div key={match.fixture_id} style={{ background: '#13131a', border: '1px solid ' + (badge ? badge.colour + '40' : '#2a2a3a'), borderRadius: idx === byLeague[league].length - 1 ? '0 0 6px 6px' : '0', marginBottom: '2px', overflow: 'hidden' }}>
                        <div onClick={() => toggle(match.fixture_id)} style={{ padding: '10px 12px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>vs</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.away_team}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {badge && <div style={{ fontSize: '9px', fontWeight: 700, color: badge.colour, marginBottom: '2px' }}>{badge.label}</div>}
                              {topScore > 0 && <div style={{ fontSize: '16px', fontWeight: 900, color: badge ? badge.colour : '#9ca3af' }}>{Math.round(topScore)}</div>}
                              <div style={{ fontSize: '10px', color: '#4b5563' }}>{formatDate(matchDate)}</div>
                              <div style={{ fontSize: '10px', color: '#4b5563' }}>{formatKickoff(match.kickoff_time)}</div>
                            </div>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: '1px solid #2a2a3a', padding: '10px 12px', fontSize: '12px' }}>
                            {match.score ? (
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ flex: 1, textAlign: 'center', background: '#1c1c28', borderRadius: '4px', padding: '6px' }}>
                                  <div style={{ fontSize: '18px', fontWeight: 900, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Home</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', background: '#1c1c28', borderRadius: '4px', padding: '6px' }}>
                                  <div style={{ fontSize: '18px', fontWeight: 900, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Away</div>
                                </div>
                              </div>
                            ) : <div style={{ color: '#4b5563', marginBottom: '8px' }}>Score pending</div>}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {['Bet365','W.Hill','Ladbrokes','Coral','P.Power','Betfred'].map(b => (
                                <a key={b} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1c1c28', border: '1px solid #2a2a3a', color: '#9ca3af', padding: '3px 7px', borderRadius: '3px', fontSize: '10px' }}>{b}</a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}