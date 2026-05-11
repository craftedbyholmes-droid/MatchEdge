'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useLeague } from '@/context/LeagueContext'
import LeagueSelector from '@/components/LeagueSelector'
import PlanGate from '@/components/PlanGate'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardPage() {
  const { plan } = usePlan()
  const { activeLeague, activeCategory } = useLeague()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  function loadMatches() {
    fetch('/api/matches').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false)
      setRefreshing(false)
    }).catch(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { loadMatches() }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  // Filter by active league from global context
  const filtered = activeCategory === 'top_leagues'
    ? matches.filter(m => m.league === activeLeague)
    : matches

  const sorted = [...filtered].sort((a, b) => {
    const aS = Math.max(a.score?.total_home || 0, a.score?.total_away || 0)
    const bS = Math.max(b.score?.total_home || 0, b.score?.total_away || 0)
    return bS - aS
  })

  const highConf = matches.filter(m => Math.max(m.score?.total_home || 0, m.score?.total_away || 0) >= 75).length

  function formatKO(kt) { if (!kt) return ''; return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function getBadge(score) { if (!score) return null; const t = Math.max(score.total_home || 0, score.total_away || 0); if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }; if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }; return null }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '2px' }}>Today</h1>
          <div style={{ fontSize: '13px', color: '#484F58' }}>{dateLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {plan === 'edge' && <span style={{ fontSize: '11px', background: '#F0B90B20', color: '#F0B90B', border: '1px solid #F0B90B40', padding: '3px 10px', borderRadius: '10px', fontWeight: 700 }}>EDGE</span>}
          {plan === 'edge' && <button onClick={() => { setRefreshing(true); loadMatches() }} disabled={refreshing} style={{ padding: '6px 14px', background: '#1E2530', border: '1px solid #2A3441', color: '#8B949E', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Matches Today', value: matches.length },
          { label: 'High Confidence', value: highConf },
          { label: 'Tipster Picks', value: 0 }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#484F58', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <LeagueSelector />

      {loading ? <LoadingSpinner message='Loading matches...' /> : sorted.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#484F58', fontSize: '14px', marginBottom: '6px' }}>No matches found for {activeLeague} today.</div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Try another league or check back later.</div>
        </div>
      ) : (
        sorted.map(match => {
          const homeScore = match.score?.total_home || 0
          const awayScore = match.score?.total_away || 0
          const topScore = Math.max(homeScore, awayScore)
          const badge = getBadge(match.score)
          const isOpen = expanded[match.fixture_id]
          return (
            <div key={match.fixture_id} style={{ background: '#161B22', border: '1px solid ' + (badge ? badge.colour + '40' : '#2A3441'), borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
              <div onClick={() => toggle(match.fixture_id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                    <span style={{ color: '#484F58', fontSize: '12px' }}>vs</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#484F58' }}>{match.league} - {formatKO(match.kickoff_time)}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                  {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                  {topScore > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(topScore)}</div><div style={{ fontSize: '10px', color: '#484F58' }}>score</div></div>}
                  <span style={{ color: '#484F58' }}>{isOpen ? 'v' : '>'}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid #2A3441', padding: '16px' }}>
                  {match.score ? (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, background: '#1E2530', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>HOME</div>
                        <div style={{ fontSize: '26px', fontWeight: 900, color: homeScore > awayScore ? '#00C896' : '#E6EDF3' }}>{Math.round(homeScore)}</div>
                        <div style={{ fontSize: '11px', color: '#8B949E' }}>{match.home_team}</div>
                      </div>
                      <div style={{ flex: 1, background: '#1E2530', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>AWAY</div>
                        <div style={{ fontSize: '26px', fontWeight: 900, color: awayScore > homeScore ? '#00C896' : '#E6EDF3' }}>{Math.round(awayScore)}</div>
                        <div style={{ fontSize: '11px', color: '#8B949E' }}>{match.away_team}</div>
                      </div>
                    </div>
                  ) : <div style={{ color: '#484F58', fontSize: '13px', marginBottom: '12px' }}>Score pending - run Score from Admin.</div>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred'].map(n => (
                      <a key={n} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1E2530', border: '1px solid #2A3441', color: '#8B949E', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none' }}>{n}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#484F58', textAlign: 'center' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#484F58' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}