'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useLeague } from '@/context/LeagueContext'
import LeagueSelector from '@/components/LeagueSelector'
import LoadingSpinner from '@/components/LoadingSpinner'

const GBP = String.fromCharCode(163)
const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']

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

  function getBadge(score) {
    if (!score) return null
    const t = Math.max(score.total_home || 0, score.total_away || 0)
    if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }
    if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }
    return null
  }

  function getPrediction(match) {
    if (!match.score) return null
    const h = match.score.total_home || 0
    const a = match.score.total_away || 0
    const gap = Math.abs(h - a)
    if (gap < 5) return { text: 'Too close to call', colour: '#F0B90B' }
    const fav = h > a ? match.home_team : match.away_team
    return { text: fav + ' favoured (' + Math.round(gap) + 'pt gap)', colour: '#00C896' }
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '2px' }}>Today</h1>
          <div style={{ fontSize: '13px', color: '#8B949E' }}>{dateLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {plan === 'edge' && <span style={{ fontSize: '11px', background: '#F0B90B20', color: '#F0B90B', border: '1px solid #F0B90B40', padding: '3px 10px', borderRadius: '10px', fontWeight: 700 }}>EDGE</span>}
          {plan === 'edge' && <button onClick={() => { setRefreshing(true); loadMatches() }} disabled={refreshing} style={{ padding: '6px 14px', background: '#161B22', border: '1px solid #2A3441', color: '#8B949E', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>}
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
            <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <LeagueSelector />

      {loading ? <LoadingSpinner message='Loading matches...' /> : sorted.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#8B949E', fontSize: '14px', marginBottom: '6px' }}>No matches found for {activeLeague} today.</div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Try another league or run Fetch Fixtures from Admin.</div>
        </div>
      ) : sorted.map(match => {
        const homeScore = match.score?.total_home || 0
        const awayScore = match.score?.total_away || 0
        const topScore = Math.max(homeScore, awayScore)
        const badge = getBadge(match.score)
        const pred = getPrediction(match)
        const isOpen = expanded[match.fixture_id]
        return (
          <div key={match.fixture_id} style={{ marginBottom: '10px' }}>
            {/* Collapsed header - dark */}
            <div onClick={() => toggle(match.fixture_id)} style={{ background: '#161B22', border: '1px solid ' + (badge ? badge.colour + '50' : '#2A3441'), borderRadius: isOpen ? '10px 10px 0 0' : '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {badge && <span style={{ background: badge.colour, color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>{badge.label}</span>}
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{match.home_team}</span>
                  <span style={{ color: '#484F58', fontSize: '12px' }}>vs</span>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{match.away_team}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#8B949E' }}>{match.league} - {formatKO(match.kickoff_time)}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                {topScore > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(topScore)}</div>
                    <div style={{ fontSize: '10px', color: '#484F58' }}>score</div>
                  </div>
                )}
                <span style={{ color: '#484F58', fontSize: '14px' }}>{isOpen ? 'v' : '>'}</span>
              </div>
            </div>

            {/* Expanded - WHITE background */}
            {isOpen && (
              <div style={{ background: '#ffffff', border: '2px solid ' + (badge ? badge.colour : '#00C896'), borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px 18px', color: '#111' }}>
                {/* Engine scores */}
                {match.score && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '8px', padding: '12px', textAlign: 'center', border: homeScore > awayScore ? '2px solid #00C896' : '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>HOME ENGINE</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: homeScore > awayScore ? '#00C896' : '#111' }}>{Math.round(homeScore)}</div>
                      <div style={{ fontSize: '12px', color: '#444', marginTop: '2px', fontWeight: 600 }}>{match.home_team}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '8px', padding: '12px', textAlign: 'center', border: awayScore > homeScore ? '2px solid #00C896' : '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>AWAY ENGINE</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: awayScore > homeScore ? '#00C896' : '#111' }}>{Math.round(awayScore)}</div>
                      <div style={{ fontSize: '12px', color: '#444', marginTop: '2px', fontWeight: 600 }}>{match.away_team}</div>
                    </div>
                  </div>
                )}
                {/* Prediction */}
                {pred && (
                  <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: pred.colour === '#00C896' ? '#007a5e' : '#b38600' }}>
                    {pred.text}
                  </div>
                )}
                {/* Bookmakers */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #e5e5e5' }}>
                  <span style={{ fontSize: '11px', color: '#888', lineHeight: '26px', marginRight: '4px' }}>Bet with:</span>
                  {BOOKMAKERS.map(bm => (
                    <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}