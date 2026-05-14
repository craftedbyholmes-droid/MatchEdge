'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useLeague } from '@/context/LeagueContext'
import LeagueSelector from '@/components/LeagueSelector'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { getCategory, TOP_LEAGUE_NAMES } from '@/lib/leagueCategories'

const GBP = String.fromCharCode(163)
const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']

function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.4) return '1/3'; if (n < 0.55) return '4/7'; if (n < 0.7) return '4/6'
  if (n < 0.85) return '5/6'; if (n < 1.05) return 'Evs'; if (n < 1.2) return '11/10'
  if (n < 1.4) return '6/5'; if (n < 1.6) return '6/4'; if (n < 1.85) return '7/4'
  if (n < 2.1) return '2/1'; if (n < 2.4) return '9/4'; if (n < 2.7) return '5/2'
  if (n < 3.1) return '3/1'; if (n < 3.6) return '7/2'; if (n < 4.1) return '4/1'
  return Math.round(n) + '/1'
}

function OddsBox({ label, odds, signal }) {
  return (
    <div style={{ flex: 1, background: signal ? '#f0faf6' : '#f5f5f5', border: '1px solid ' + (signal ? '#00C89660' : '#e0e0e0'), borderRadius: '6px', padding: '8px 4px', textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', lineHeight: '1.3', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 800, color: signal ? '#007a5e' : '#111' }}>{odds}</div>
      {signal && <div style={{ fontSize: '9px', color: '#00C896', fontWeight: 700, marginTop: '2px' }}>PICK</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { plan } = usePlan()
  const router = useRouter()
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

  const categorised = {
    top_leagues:   matches.filter(m => getCategory(m.sd_league_id) === 'top_leagues'),
    domestic_cups: matches.filter(m => getCategory(m.sd_league_id) === 'domestic_cups'),
    european:      matches.filter(m => getCategory(m.sd_league_id) === 'european'),
    international: matches.filter(m => getCategory(m.sd_league_id) === 'international')
  }

  let filtered = []
  if (activeCategory === 'top_leagues') {
    filtered = categorised.top_leagues.filter(m => m.league === activeLeague)
  } else {
    filtered = categorised[activeCategory] || []
  }

  const sorted = [...filtered].sort((a, b) =>
    Math.max(b.score?.total_home||0, b.score?.total_away||0) - Math.max(a.score?.total_home||0, a.score?.total_away||0)
  )

  const showCounts = {}
  TOP_LEAGUE_NAMES.forEach(l => {
    showCounts[l] = categorised.top_leagues.filter(m => m.league === l).length
  })

  const catCounts = {
    top_leagues:   categorised.top_leagues.length,
    domestic_cups: categorised.domestic_cups.length,
    european:      categorised.european.length,
    international: categorised.international.length
  }

  const highConf = matches.filter(m => Math.max(m.score?.total_home||0, m.score?.total_away||0) >= 75).length

  function fmtKO(kt) { return kt ? new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '' }

  function getBadge(score) {
    if (!score) return null
    const t = Math.max(score.total_home||0, score.total_away||0)
    if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }
    if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }
    return null
  }

  function getCategoryLabel(cat) {
    const labels = { top_leagues: 'Top Leagues', domestic_cups: 'Domestic Cups', european: 'European', international: 'International' }
    return labels[cat] || cat
  }

  return (
    <div className='me-page'>

      {/* Header */}
      <div className='me-flex-between' style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className='me-title' style={{ marginBottom: '2px' }}>Today</h1>
          <div className='me-sub'>{dateLabel}</div>
        </div>
        <div className='me-flex'>
          {plan === 'edge' && <span className='me-badge me-badge-gold'>EDGE</span>}
          {plan === 'edge' && (
            <button className='me-btn' onClick={() => { setRefreshing(true); loadMatches() }} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className='me-grid-3' style={{ marginBottom: '20px' }}>
        {[
          { label: 'Matches Today',   value: matches.length },
          { label: 'High Confidence', value: highConf },
          { label: 'Tipster Picks',   value: 0 }
        ].map(s => (
          <div key={s.label} className='me-stat'>
            <div className='me-stat-value'>{s.value}</div>
            <div className='me-stat-label'>{s.label}</div>
          </div>
        ))}
      </div>

      <LeagueSelector showCounts={showCounts} catCounts={catCounts} />

      {loading ? <LoadingSpinner message='Loading matches...' /> : sorted.length === 0 ? (
        <div className='me-card' style={{ textAlign: 'center', padding: '32px' }}>
          <div className='me-sub' style={{ marginBottom: '6px' }}>
            No {getCategoryLabel(activeCategory)} matches today{activeCategory === 'top_leagues' ? ' for ' + activeLeague : ''}.
          </div>
          <div className='me-muted'>Try another category or league above.</div>
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
        const odds = match.score?.modifiers?.odds
        const isLive = match.status === 'live'
        const isFT   = match.status === 'FT'

        return (
          <div key={match.fixture_id} style={{ marginBottom: '10px' }}>

            {/* Match row - collapsed */}
            <div
              onClick={() => toggle(match.fixture_id)}
              style={{
                background: '#161B22',
                border: '2px solid ' + (badge ? badge.colour + '60' : '#2A3441'),
                borderBottom: isOpen ? 'none' : undefined,
                borderRadius: isOpen ? '10px 10px 0 0' : '10px',
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              {/* Top row: badge + time + score */}
              <div className='me-flex-between' style={{ marginBottom: '6px' }}>
                <div className='me-flex' style={{ flexWrap: 'wrap', gap: '6px' }}>
                  {badge && <span className='me-badge' style={{ background: badge.colour, color: '#000' }}>{badge.label}</span>}
                  {isLive && <span className='me-badge me-badge-live'>LIVE</span>}
                  {isFT   && <span className='me-badge me-badge-grey'>FT</span>}
                  <span className='me-muted'>{match.league}</span>
                  <span className='me-muted'>{fmtKO(match.kickoff_time)}</span>
                </div>
                <div className='me-flex' style={{ gap: '10px' }}>
                  {top > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(top)}</div>
                      <div className='me-muted'>score</div>
                    </div>
                  )}
                  <span style={{ color: '#484F58', fontSize: '14px', fontWeight: 700 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Team names row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team}</span>
                <span className='me-muted' style={{ flexShrink: 0 }}>vs</span>
                <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{match.away_team}</span>
              </div>

              {/* Live score if in play */}
              {(isLive || isFT) && match.home_score != null && (
                <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 900, marginTop: '6px' }}>
                  {match.home_score} - {match.away_score}
                </div>
              )}
            </div>

            {/* Expanded panel */}
            {isOpen && (
              <div style={{ background: '#ffffff', border: '2px solid ' + (badge ? badge.colour + '60' : '#00C896'), borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', color: '#111' }}>

                {/* Engine scores */}
                {match.score && (
                  <div className='me-grid-2' style={{ marginBottom: '14px' }}>
                    {[
                      { label: 'Home Engine', team: match.home_team, score: h, lead: h > a },
                      { label: 'Away Engine', team: match.away_team, score: a, lead: a > h }
                    ].map(s => (
                      <div key={s.label} style={{ background: '#f5f5f5', border: s.lead ? '2px solid #00C896' : '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '26px', fontWeight: 900, color: s.lead ? '#00C896' : '#333' }}>{Math.round(s.score)}</div>
                        <div style={{ fontSize: '11px', color: '#444', fontWeight: 600, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.team}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prediction label */}
                {pred && (
                  <div style={{ background: gap < 5 ? '#fff8e6' : '#f0faf6', border: '1px solid ' + (gap < 5 ? '#F0B90B60' : '#00C89660'), borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: gap < 5 ? '#b38600' : '#007a5e' }}>
                    {pred}
                  </div>
                )}

                {/* Odds */}
                {odds && (() => {
                  const homeW = decToFrac(odds.match_winner?.home)
                  const draw  = decToFrac(odds.match_winner?.draw)
                  const awayW = decToFrac(odds.match_winner?.away)
                  const over  = decToFrac(odds.over_under?.over)
                  const under = decToFrac(odds.over_under?.under)
                  const hasMatch = homeW !== 'N/A' || draw !== 'N/A' || awayW !== 'N/A'
                  const hasOU    = over !== 'N/A' || under !== 'N/A'
                  if (!hasMatch && !hasOU) return null
                  return (
                    <div style={{ marginBottom: '14px' }}>
                      {hasMatch && (
                        <div style={{ marginBottom: '10px' }}>
                          <div className='me-label'>Match Result</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <OddsBox label={match.home_team} odds={homeW} signal={h > a + 15} />
                            <OddsBox label='Draw' odds={draw} signal={gap < 5} />
                            <OddsBox label={match.away_team} odds={awayW} signal={a > h + 15} />
                          </div>
                        </div>
                      )}
                      {hasOU && (
                        <div>
                          <div className='me-label'>Goals Market</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <OddsBox label='Over 2.5' odds={over} signal={false} />
                            <OddsBox label='Under 2.5' odds={under} signal={false} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {!match.score && <div style={{ color: '#888', fontSize: '13px', marginBottom: '14px' }}>Engine score pending.</div>}

                {/* Bookmakers + CTA */}
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 600 }}>BET WITH</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {BOOKMAKERS.map(bm => (
                      <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/match/' + match.fixture_id)}
                    style={{ width: '100%', padding: '10px', background: '#0B0E11', border: '1px solid #2A3441', color: '#00C896', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                  >
                    Full Match Analysis →
                  </button>
                  <div className='me-muted' style={{ marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}