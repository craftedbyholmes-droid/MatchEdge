'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useLeague } from '@/context/LeagueContext'
import LeagueSelector from '@/components/LeagueSelector'
import PlanGate from '@/components/PlanGate'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']

const LEAGUE_COLOURS = {
  'Bundesliga': '#d00', 'La Liga': '#c60', 'Ligue 1': '#004494',
  'Premier League': '#3d195b', 'Premiership': '#005EB8', 'Serie A': '#0066cc'
}

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

export default function UpcomingPage() {
  const { plan } = usePlan()
  const router = useRouter()
  const { activeLeague, activeCategory } = useLeague()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      setMatches((Array.isArray(d) ? d : []).filter(m => m.home_team && m.away_team))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']
  const byLeague = {}
  LEAGUE_ORDER.forEach(l => { byLeague[l] = [] })
  matches.forEach(m => { if (byLeague[m.league]) byLeague[m.league].push(m) })
  LEAGUE_ORDER.forEach(l => { byLeague[l].sort((a, b) => Math.max(b.score?.total_home||0,b.score?.total_away||0) - Math.max(a.score?.total_home||0,a.score?.total_away||0)) })
  const showCounts = {}
  LEAGUE_ORDER.forEach(l => { showCounts[l] = byLeague[l]?.length || 0 })

  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  function fmtDate(d) {
    if (!d) return 'TBC'
    if (d === today) return 'Today'
    if (d === tomorrow) return 'Tomorrow'
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  function fmtKO(kt) { return kt ? new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'TBC' }
  function getBadge(score) {
    if (!score) return null
    const t = Math.max(score.total_home||0, score.total_away||0)
    if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }
    if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }
    return null
  }

  if (plan === 'free') return (
    <div className='me-page'>
      <h1 className='me-title' style={{ marginBottom: '20px' }}>Upcoming Fixtures</h1>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  const leagueMatches = byLeague[activeLeague] || []
  const leagueColour  = LEAGUE_COLOURS[activeLeague] || '#161B22'

  return (
    <div className='me-page'>
      {/* Header */}
      <div className='me-flex-between' style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className='me-title'>Upcoming Fixtures</h1>
          <p className='me-sub' style={{ marginTop: '4px' }}>Engine predictions and real odds. Tap any match to expand.</p>
        </div>
      </div>

      {/* Provisional notice */}
      <div className='me-card' style={{ borderColor: '#F0B90B40', marginBottom: '20px', padding: '10px 14px' }}>
        <div style={{ fontSize: '13px', color: '#F0B90B' }}>Provisional scores — update automatically as injuries and lineups are confirmed.</div>
      </div>

      <LeagueSelector showCounts={showCounts} />

      {loading ? <LoadingSpinner message='Loading fixtures...' /> : activeCategory !== 'top_leagues' ? (
        <div className='me-card' style={{ textAlign: 'center', padding: '32px' }}>
          <div className='me-sub' style={{ marginBottom: '16px' }}>Browse all competitions in this category.</div>
          <Link href='/competitions' style={{ background: '#00C896', color: '#0B0E11', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Browse Competitions</Link>
        </div>
      ) : leagueMatches.length === 0 ? (
        <div className='me-card' style={{ textAlign: 'center', padding: '32px' }}>
          <div className='me-sub'>No upcoming fixtures for {activeLeague}.</div>
        </div>
      ) : (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2A3441' }}>
          {/* League header */}
          <div style={{ background: leagueColour, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{activeLeague}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{leagueMatches.length} matches</div>
          </div>

          {leagueMatches.map((match, idx) => {
            const h = match.score?.total_home || 0
            const a = match.score?.total_away || 0
            const top = Math.max(h, a)
            const gap = Math.abs(h - a)
            const badge = getBadge(match.score)
            const isOpen = expanded[match.fixture_id]
            const isLast = idx === leagueMatches.length - 1
            const fav = h >= a ? match.home_team : match.away_team
            const pred = top > 0 ? (gap < 5 ? 'Too close to call' : fav + ' favoured (' + Math.round(gap) + 'pt gap)') : null
            const odds = match.score?.modifiers?.odds
            const homeW = odds ? decToFrac(odds.match_winner?.home) : null
            const draw  = odds ? decToFrac(odds.match_winner?.draw)  : null
            const awayW = odds ? decToFrac(odds.match_winner?.away) : null
            const hasOdds = homeW && homeW !== 'N/A'

            return (
              <div key={match.fixture_id}>
                {/* Collapsed row */}
                <div
                  onClick={() => toggle(match.fixture_id)}
                  style={{ background: '#161B22', borderTop: idx > 0 ? '1px solid #2A3441' : 'none', padding: '12px 14px', cursor: 'pointer' }}
                >
                  {/* Top row */}
                  <div className='me-flex-between' style={{ marginBottom: '6px' }}>
                    <div className='me-flex' style={{ flexWrap: 'wrap', gap: '5px' }}>
                      {badge && <span className='me-badge' style={{ background: badge.colour, color: '#000' }}>{badge.label}</span>}
                      <span className='me-muted'>{fmtDate(match.kickoff_time?.split('T')[0])} {fmtKO(match.kickoff_time)}</span>
                    </div>
                    <div className='me-flex' style={{ gap: '8px' }}>
                      {top > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(top)}</div>
                          <div className='me-muted'>score</div>
                        </div>
                      )}
                      <span className='me-muted'>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {/* Team names */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team}</span>
                    <span className='me-muted' style={{ flexShrink: 0 }}>vs</span>
                    <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{match.away_team}</span>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ background: '#ffffff', borderTop: '2px solid ' + leagueColour, padding: '14px', color: '#111' }}>
                    {/* Engine scores */}
                    {match.score && (
                      <div className='me-grid-2' style={{ marginBottom: '12px' }}>
                        {[
                          { label: 'HOME ENGINE', team: match.home_team, score: h, lead: h > a },
                          { label: 'AWAY ENGINE', team: match.away_team, score: a, lead: a > h }
                        ].map(s => (
                          <div key={s.label} style={{ background: '#f5f5f5', border: s.lead ? '2px solid #00C896' : '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: s.lead ? '#00C896' : '#333' }}>{Math.round(s.score)}</div>
                            <div style={{ fontSize: '11px', color: '#444', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.team}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Prediction */}
                    {pred && (
                      <div style={{ background: '#f0f9f6', border: '1px solid #00C89640', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#007a5e' }}>{pred}</div>
                    )}

                    {/* Odds */}
                    {hasOdds && (
                      <div style={{ marginBottom: '12px' }}>
                        <div className='me-label' style={{ marginBottom: '6px' }}>Match Result</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[
                            { label: match.home_team, odds: homeW },
                            { label: 'Draw', odds: draw },
                            { label: match.away_team, odds: awayW }
                          ].map(o => (
                            <div key={o.label} style={{ flex: 1, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 4px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>{o.odds}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bookmakers */}
                    <div style={{ paddingTop: '10px', borderTop: '1px solid #e5e5e5' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 600 }}>BET WITH</div>
                      <div className='me-flex-wrap' style={{ marginBottom: '10px' }}>
                        {BOOKMAKERS.map(bm => (
                          <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '4px 9px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                        ))}
                      </div>
                      <button onClick={() => router.push('/match/' + match.fixture_id)} style={{ width: '100%', padding: '9px', background: '#0B0E11', border: '1px solid #2A3441', color: '#00C896', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                        Full Match Analysis →
                      </button>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '6px', textAlign: 'center' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}