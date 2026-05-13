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

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  function fmtDate(d) { if (!d) return 'TBC'; if (d === today) return 'Today'; if (d === tomorrow) return 'Tomorrow'; return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
  function fmtKO(kt) { if (!kt) return 'TBC'; return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function getBadge(score) { if (!score) return null; const t = Math.max(score.total_home||0,score.total_away||0); if (t>=80) return { label:'BEST BET',colour:'#F0B90B' }; if (t>=75) return { label:'HIGH CONF',colour:'#00C896' }; return null }
  function getPred(match) { if (!match.score) return null; const h=match.score.total_home||0,a=match.score.total_away||0,gap=Math.abs(h-a); if (gap<5) return 'Too close to call'; return (h>a?match.home_team:match.away_team)+' favoured ('+Math.round(gap)+'pt gap)' }
  function getOdds(match) { const odds=match.score?.modifiers?.odds; if (!odds) return null; return { home: decToFrac(odds.match_winner?.home), draw: decToFrac(odds.match_winner?.draw), away: decToFrac(odds.match_winner?.away) } }

  if (plan === 'free') return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Upcoming Fixtures</h1>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  const leagueMatches = byLeague[activeLeague] || []

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
          <p style={{ color: '#8B949E', fontSize: '13px', marginTop: '4px' }}>Engine predictions and real odds. Click any match to expand.</p>
        </div>
        <Link href='/competitions' style={{ background: '#161B22', border: '1px solid #2A3441', color: '#8B949E', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>All Competitions</Link>
      </div>

      <div style={{ background: '#161B22', border: '1px solid #F0B90B40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#F0B90B' }}>
        Provisional scores - update automatically as injuries and lineups are confirmed.
      </div>

      <LeagueSelector showCounts={showCounts} />

      {loading ? <LoadingSpinner message='Loading fixtures...' /> : activeCategory !== 'top_leagues' ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#8B949E', marginBottom: '16px' }}>Browse all competitions in this category.</div>
          <Link href='/competitions' style={{ background: '#00C896', color: '#0B0E11', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Browse Competitions</Link>
        </div>
      ) : leagueMatches.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#8B949E', fontSize: '14px' }}>
          No upcoming fixtures for {activeLeague}.
        </div>
      ) : (
        <div>
          <div style={{ background: LEAGUE_COLOURS[activeLeague] || '#161B22', borderRadius: '8px 8px 0 0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{activeLeague}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{leagueMatches.length} matches</div>
          </div>
          {leagueMatches.map((match, idx) => {
            const topScore = Math.max(match.score?.total_home||0, match.score?.total_away||0)
            const badge = getBadge(match.score)
            const isOpen = expanded[match.fixture_id]
            const pred = getPred(match)
            const odds = getOdds(match)
            const isLast = idx === leagueMatches.length - 1
            return (
              <div key={match.fixture_id} style={{ marginBottom: 0 }}>
                {/* Header - dark */}
                <div onClick={() => toggle(match.fixture_id)} style={{ background: '#161B22', border: '1px solid ' + (badge ? badge.colour + '40' : '#2A3441'), borderTop: 'none', borderRadius: (!isOpen && isLast) ? '0 0 8px 8px' : '0', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {badge && <span style={{ background: badge.colour, color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>{badge.label}</span>}
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{match.home_team}</span>
                      <span style={{ color: '#484F58', fontSize: '12px' }}>vs</span>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{match.away_team}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8B949E' }}>{fmtDate(match.kickoff_time?.split('T')[0])} - {fmtKO(match.kickoff_time)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {topScore > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '20px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(topScore)}</div><div style={{ fontSize: '10px', color: '#484F58' }}>score</div></div>}
                    <span style={{ color: '#484F58' }}>{isOpen ? 'v' : '>'}</span>
                  </div>
                </div>
                {/* Expanded - WHITE */}
                {isOpen && (
                  <div style={{ background: '#ffffff', border: '2px solid ' + (LEAGUE_COLOURS[activeLeague] || '#00C896'), borderTop: 'none', borderRadius: isLast ? '0 0 8px 8px' : '0', padding: '16px 18px', color: '#111' }}>
                    {/* Engine scores */}
                    {match.score && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '8px', padding: '12px', textAlign: 'center', border: (match.score.total_home||0) > (match.score.total_away||0) ? '2px solid #00C896' : '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>HOME ENGINE</div>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: (match.score.total_home||0) > (match.score.total_away||0) ? '#00C896' : '#111' }}>{Math.round(match.score.total_home||0)}</div>
                          <div style={{ fontSize: '12px', color: '#444', fontWeight: 600 }}>{match.home_team}</div>
                        </div>
                        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '8px', padding: '12px', textAlign: 'center', border: (match.score.total_away||0) > (match.score.total_home||0) ? '2px solid #00C896' : '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>AWAY ENGINE</div>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: (match.score.total_away||0) > (match.score.total_home||0) ? '#00C896' : '#111' }}>{Math.round(match.score.total_away||0)}</div>
                          <div style={{ fontSize: '12px', color: '#444', fontWeight: 600 }}>{match.away_team}</div>
                        </div>
                      </div>
                    )}
                    {/* Prediction */}
                    {pred && <div style={{ background: '#f0f9f6', border: '1px solid #00C89640', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: '#007a5e' }}>{pred}</div>}
                    {/* Odds */}
                    {odds && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        {[
                          { label: match.home_team + ' Win', odds: odds.home },
                          { label: 'Draw', odds: odds.draw },
                          { label: match.away_team + ' Win', odds: odds.away }
                        ].map(o => (
                          <div key={o.label} style={{ flex: 1, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{o.label}</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{o.odds}</div>
                          </div>
                        ))}
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
      )}
    </div>
  )
}