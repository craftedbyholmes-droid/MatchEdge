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

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  function loadMatches() {
    fetch('/api/matches').then(r => r.json()).then(d => {
      setMatches(Array.isArray(d) ? d : [])
      setLoading(false); setRefreshing(false)
    }).catch(() => { setLoading(false); setRefreshing(false) })
  }
  useEffect(() => { loadMatches() }, [])
  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const filtered = activeCategory === 'top_leagues'
    ? matches.filter(m => m.league === activeLeague)
    : matches
  const sorted = [...filtered].sort((a, b) =>
    Math.max(b.score?.total_home||0, b.score?.total_away||0) - Math.max(a.score?.total_home||0, a.score?.total_away||0)
  )
  const highConf = matches.filter(m => Math.max(m.score?.total_home||0, m.score?.total_away||0) >= 75).length

  function fmtKO(kt) { return kt ? new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '' }
  function getBadge(score) {
    if (!score) return null
    const t = Math.max(score.total_home||0, score.total_away||0)
    if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }
    if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }
    return null
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
        {[{ label: 'Matches Today', value: matches.length }, { label: 'High Confidence', value: highConf }, { label: 'Tipster Picks', value: 0 }].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#8B949E', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <LeagueSelector />

      {loading ? <LoadingSpinner message='Loading matches...' /> : sorted.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#8B949E', fontSize: '14px', marginBottom: '6px' }}>No matches for {activeLeague} today.</div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Try another league above.</div>
        </div>
      ) : sorted.map(match => {
        const h = match.score?.total_home || 0
        const a = match.score?.total_away || 0
        const top = Math.max(h, a)
        const badge = getBadge(match.score)
        const isOpen = !!expanded[match.fixture_id]
        const gap = Math.abs(h - a)
        const fav = h >= a ? match.home_team : match.away_team
        const pred = top > 0 ? (gap < 5 ? 'Too close to call' : fav + ' favoured (' + Math.round(gap) + 'pt gap)') : null
        return (
          <div key={match.fixture_id} style={{ marginBottom: '10px' }}>
            <div onClick={() => toggle(match.fixture_id)} style={{ background: '#161B22', border: '2px solid ' + (badge ? badge.colour + '60' : '#2A3441'), borderBottom: isOpen ? 'none' : undefined, borderRadius: isOpen ? '10px 10px 0 0' : '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {badge && <span style={{ background: badge.colour, color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>{badge.label}</span>}
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{match.home_team}</span>
                  <span style={{ color: '#484F58', fontSize: '13px' }}>vs</span>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{match.away_team}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#8B949E' }}>{match.league} - {fmtKO(match.kickoff_time)}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                {top > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '20px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(top)}</div><div style={{ fontSize: '10px', color: '#484F58' }}>score</div></div>}
                <span style={{ color: '#484F58', fontSize: '16px', fontWeight: 700 }}>{isOpen ? String.fromCharCode(8964) : '>'}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ background: '#ffffff', border: '2px solid ' + (badge ? badge.colour + '60' : '#00C896'), borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', color: '#111' }}>
                {match.score && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ flex: 1, background: '#f5f5f5', border: h > a ? '2px solid #00C896' : '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Home Engine</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: h > a ? '#00C896' : '#333' }}>{Math.round(h)}</div>
                      <div style={{ fontSize: '12px', color: '#444', fontWeight: 600, marginTop: '2px' }}>{match.home_team}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f5f5f5', border: a > h ? '2px solid #00C896' : '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Away Engine</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: a > h ? '#00C896' : '#333' }}>{Math.round(a)}</div>
                      <div style={{ fontSize: '12px', color: '#444', fontWeight: 600, marginTop: '2px' }}>{match.away_team}</div>
                    </div>
                  </div>
                )}
                {pred && (
                  <div style={{ background: gap < 5 ? '#fff8e6' : '#f0faf6', border: '1px solid ' + (gap < 5 ? '#F0B90B60' : '#00C89660'), borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: gap < 5 ? '#b38600' : '#007a5e' }}>
                    {pred}
                  </div>
                )}
                {!match.score && <div style={{ color: '#888', fontSize: '13px', marginBottom: '14px' }}>Engine score pending - run Score from Admin.</div>}
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#888', marginRight: '4px' }}>Bet with:</span>
                    {BOOKMAKERS.map(bm => (
                      <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}