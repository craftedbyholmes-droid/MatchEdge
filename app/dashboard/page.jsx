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
  function goToMatch(id, e) { e.stopPropagation(); router.push('/match/' + id) }

  // Categorise all matches
  const categorised = {
    top_leagues:   matches.filter(m => getCategory(m.sd_league_id) === 'top_leagues'),
    domestic_cups: matches.filter(m => getCategory(m.sd_league_id) === 'domestic_cups'),
    european:      matches.filter(m => getCategory(m.sd_league_id) === 'european'),
    international: matches.filter(m => getCategory(m.sd_league_id) === 'international')
  }

  // Filter by active category then active league within top_leagues
  let filtered = []
  if (activeCategory === 'top_leagues') {
    filtered = categorised.top_leagues.filter(m => m.league === activeLeague)
  } else {
    filtered = categorised[activeCategory] || []
  }

  const sorted = [...filtered].sort((a, b) =>
    Math.max(b.score?.total_home||0, b.score?.total_away||0) - Math.max(a.score?.total_home||0, a.score?.total_away||0)
  )

  // Counts per league for the selector
  const showCounts = {}
  TOP_LEAGUE_NAMES.forEach(l => {
    showCounts[l] = categorised.top_leagues.filter(m => m.league === l).length
  })

  // Category counts for the category tabs
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

      <LeagueSelector showCounts={showCounts} catCounts={catCounts} />

      {loading ? <LoadingSpinner message='Loading matches...' /> : sorted.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#8B949E', fontSize: '14px', marginBottom: '6px' }}>
            No {getCategoryLabel(activeCategory)} matches today{activeCategory === 'top_leagues' ? ' for ' + activeLeague : ''}.
          </div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Try another category or league above.</div>
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
                <span style={{ color: '#484F58', fontSize: '16px', fontWeight: 700 }}>{isOpen ? 'v' : '>'}</span>
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
                {odds && (() => {
                  const homeW = decToFrac(odds.match_winner?.home)
                  const draw  = decToFrac(odds.match_winner?.draw)
                  const awayW = decToFrac(odds.match_winner?.away)
                  const over  = decToFrac(odds.over_under?.over)
                  const under = decToFrac(odds.over_under?.under)
                  const bttsY = decToFrac(odds.btts?.yes)
                  const bttsN = decToFrac(odds.btts?.no)
                  const hasMatch = homeW !== 'N/A' || draw !== 'N/A' || awayW !== 'N/A'
                  const hasOU    = over !== 'N/A' || under !== 'N/A'
                  const hasBTTS  = bttsY !== 'N/A' || bttsN !== 'N/A'
                  if (!hasMatch && !hasOU && !hasBTTS) return null
                  return (
                    <div style={{ marginBottom: '14px' }}>
                      {hasMatch && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '6px' }}>MATCH RESULT</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                              { label: match.home_team + ' Win', odds: homeW, signal: h > a + 15 },
                              { label: 'Draw',                   odds: draw,  signal: gap < 5 },
                              { label: match.away_team + ' Win', odds: awayW, signal: a > h + 15 }
                            ].map(o => (
                              <div key={o.label} style={{ flex: 1, background: o.signal ? '#f0faf6' : '#f5f5f5', border: '1px solid ' + (o.signal ? '#00C89660' : '#e0e0e0'), borderRadius: '6px', padding: '8px 6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', lineHeight: '1.3' }}>{o.label}</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: o.signal ? '#007a5e' : '#111' }}>{o.odds}</div>
                                {o.signal && <div style={{ fontSize: '9px', color: '#00C896', fontWeight: 700, marginTop: '2px' }}>ENGINE PICK</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(hasOU || hasBTTS) && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {hasOU && (
                            <div style={{ flex: 1, minWidth: '140px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '6px' }}>GOALS MARKET</div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[{ label: 'Over 2.5', odds: over }, { label: 'Under 2.5', odds: under }].map(o => (
                                  <div key={o.label} style={{ flex: 1, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{o.label}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{o.odds}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {hasBTTS && (
                            <div style={{ flex: 1, minWidth: '140px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '6px' }}>BOTH TEAMS TO SCORE</div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[{ label: 'Yes', odds: bttsY }, { label: 'No', odds: bttsN }].map(o => (
                                  <div key={o.label} style={{ flex: 1, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{o.label}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{o.odds}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
                {!match.score && <div style={{ color: '#888', fontSize: '13px', marginBottom: '14px' }}>Engine score pending.</div>}
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#888', marginRight: '4px' }}>Bet with:</span>
                    {BOOKMAKERS.map(bm => (
                      <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                  <button onClick={() => window.location.href = '/match/' + match.fixture_id} style={{ marginTop: '10px', width: '100%', padding: '9px', background: '#0B0E11', border: '1px solid #2A3441', color: '#00C896', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Full Match Analysis</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}