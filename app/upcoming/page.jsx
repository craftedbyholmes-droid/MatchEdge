'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useLeague } from '@/context/LeagueContext'
import LeagueSelector from '@/components/LeagueSelector'
import PlanGate from '@/components/PlanGate'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

const LEAGUE_META = {
  'Bundesliga':     { colour: '#d00',    label: 'Bundesliga (German)' },
  'La Liga':        { colour: '#c60',    label: 'La Liga (Spanish)' },
  'Ligue 1':        { colour: '#004494', label: 'Ligue 1 (French)' },
  'Premier League': { colour: '#3d195b', label: 'Premier League (English)' },
  'Premiership':    { colour: '#005EB8', label: 'Premiership (Scottish)' },
  'Serie A':        { colour: '#0066cc', label: 'Serie A (Italian)' }
}

function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.4) return '1/3'
  if (n < 0.55) return '4/7'
  if (n < 0.7) return '4/6'
  if (n < 0.85) return '5/6'
  if (n < 1.05) return 'Evs'
  if (n < 1.2) return '11/10'
  if (n < 1.4) return '6/5'
  if (n < 1.6) return '6/4'
  if (n < 1.85) return '7/4'
  if (n < 2.1) return '2/1'
  if (n < 2.4) return '9/4'
  if (n < 2.7) return '5/2'
  if (n < 3.1) return '3/1'
  if (n < 3.6) return '7/2'
  if (n < 4.1) return '4/1'
  return Math.round(n) + '/1'
}

function getGoalscorerCandidates(lineup) {
  if (!lineup?.length) return []
  return lineup.filter(p => ['Attacker', 'Midfielder'].includes(p.position)).map(p => p.player.name)
}

export default function UpcomingPage() {
  const { plan } = usePlan()
  const { activeLeague, setActiveLeague, activeCategory, setActiveCategory } = useLeague()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      const valid = (Array.isArray(d) ? d : []).filter(m =>
        m.home_team && m.away_team &&
        !['Unknown', 'None', ''].includes(m.home_team?.trim()) &&
        !['Unknown', 'None', ''].includes(m.away_team?.trim())
      )
      setMatches(valid)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']
  const byLeague = {}
  LEAGUE_ORDER.forEach(l => { byLeague[l] = [] })
  matches.forEach(m => { if (byLeague[m.league]) byLeague[m.league].push(m) })
  LEAGUE_ORDER.forEach(l => {
    byLeague[l].sort((a, b) => Math.max(b.score?.total_home || 0, b.score?.total_away || 0) - Math.max(a.score?.total_home || 0, a.score?.total_away || 0))
  })

  const showCounts = {}
  LEAGUE_ORDER.forEach(l => { showCounts[l] = byLeague[l]?.length || 0 })

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  function formatDate(d) { if (!d) return 'TBC'; if (d === today) return 'Today'; if (d === tomorrow) return 'Tomorrow'; return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
  function formatKO(kt) { if (!kt) return 'TBC'; return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function getBadge(score) { if (!score) return null; const t = Math.max(score.total_home || 0, score.total_away || 0); if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }; if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }; return null }

  function buildPredictions(match) {
    const home = match.score?.total_home || 0
    const away = match.score?.total_away || 0
    const mods = match.score?.modifiers || {}
    const realOdds = mods.odds || null
    const homeLineup = mods.home_lineup || []
    const awayLineup = mods.away_lineup || []
    if (!home && !away) return null
    const gap = Math.abs(home - away)
    const favourite = home >= away ? match.home_team : match.away_team
    const homeWinDec = realOdds?.match_winner?.home || (home > away ? (gap > 20 ? 1.5 : 1.8) : 3.2)
    const drawDec    = realOdds?.match_winner?.draw || (gap < 5 ? 3.0 : 3.8)
    const awayWinDec = realOdds?.match_winner?.away || (away > home ? (gap > 20 ? 1.5 : 1.8) : 3.2)
    const ouTotal    = realOdds?.over_under?.total || 2.5
    const overDec    = realOdds?.over_under?.over || 1.9
    const underDec   = realOdds?.over_under?.under || 1.9
    const combined   = home + away
    const homeAttackers = getGoalscorerCandidates(homeLineup)
    const awayAttackers = getGoalscorerCandidates(awayLineup)
    const allAttackers = [
      ...homeAttackers.slice(0, 3).map((n, i) => ({ name: n, team: match.home_team, side: 'home', dec: [1.8, 2.2, 2.5][i] || 3.0 })),
      ...awayAttackers.slice(0, 3).map((n, i) => ({ name: n, team: match.away_team, side: 'away', dec: [2.2, 2.5, 3.0][i] || 3.5 }))
    ]
    return {
      match_result: [
        { label: match.home_team + ' Win', odds: decToFrac(homeWinDec), signal: home > away + 15 ? 'strong' : home > away + 5 ? 'mild' : 'weak' },
        { label: 'Draw',                   odds: decToFrac(drawDec),    signal: gap < 5 ? 'mild' : 'weak' },
        { label: match.away_team + ' Win', odds: decToFrac(awayWinDec), signal: away > home + 15 ? 'strong' : away > home + 5 ? 'mild' : 'weak' }
      ],
      btts: [
        { label: 'BTTS Yes', odds: decToFrac(combined > 108 ? 1.65 : 1.85), signal: combined > 108 ? 'strong' : 'weak' },
        { label: 'BTTS No',  odds: decToFrac(combined > 108 ? 2.1 : 1.72),  signal: combined < 96 ? 'strong' : 'weak' }
      ],
      over_under: [
        { label: 'Over ' + ouTotal,  odds: decToFrac(overDec),  signal: combined > 110 ? 'strong' : 'weak' },
        { label: 'Under ' + ouTotal, odds: decToFrac(underDec), signal: combined < 96 ? 'strong' : 'weak' }
      ],
      anytime_scorer: allAttackers,
      summary: { favourite, gap: Math.round(gap), isClose: gap < 8 }
    }
  }

  if (plan === 'free') return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Upcoming Fixtures</h1>
      <p style={{ color: '#484F58', fontSize: '14px', marginBottom: '24px' }}>Early engine scores and predictions across 6 leagues.</p>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
          <p style={{ color: '#484F58', fontSize: '13px', marginTop: '4px' }}>Real odds and engine predictions. Click any match for full markets.</p>
        </div>
        <Link href='/competitions' style={{ background: '#1E2530', border: '1px solid #2A3441', color: '#8B949E', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Browse All Competitions</Link>
      </div>

      <div style={{ background: '#161B22', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Provisional scores - update automatically as injuries and lineups are confirmed.
      </div>

      <LeagueSelector showCounts={showCounts} />

      {loading ? <LoadingSpinner message='Loading fixtures...' /> : activeCategory !== 'top_leagues' ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
            {activeCategory === 'domestic_cups' ? 'Domestic Cups' : activeCategory === 'european' ? 'European' : 'International'}
          </div>
          <div style={{ color: '#484F58', fontSize: '13px', marginBottom: '16px' }}>Browse this week fixtures for all competitions in this category.</div>
          <Link href='/competitions' style={{ background: '#00C896', color: '#fff', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Browse Competitions</Link>
        </div>
      ) : byLeague[activeLeague]?.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#484F58', fontSize: '14px', marginBottom: '6px' }}>No upcoming fixtures for {LEAGUE_META[activeLeague]?.label}.</div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Use the Admin panel to fetch fixtures.</div>
        </div>
      ) : (
        <div>
          <div style={{ background: LEAGUE_META[activeLeague]?.colour, borderRadius: '8px 8px 0 0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{LEAGUE_META[activeLeague]?.label}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{byLeague[activeLeague].length} matches - highest score first</div>
          </div>
          {byLeague[activeLeague].map((match, idx) => {
            const homeScore = match.score?.total_home || 0
            const awayScore = match.score?.total_away || 0
            const topScore = Math.max(homeScore, awayScore)
            const badge = getBadge(match.score)
            const isOpen = expanded[match.fixture_id]
            const preds = buildPredictions(match)
            const isLast = idx === byLeague[activeLeague].length - 1
            return (
              <div key={match.fixture_id} style={{ background: '#161B22', border: '1px solid ' + (badge ? badge.colour + '40' : '#2A3441'), borderTop: 'none', borderRadius: isLast && !isOpen ? '0 0 8px 8px' : '0', overflow: 'hidden' }}>
                <div onClick={() => toggle(match.fixture_id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                      <span style={{ color: '#484F58', fontSize: '12px' }}>vs</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#484F58' }}>{formatDate(match.kickoff_time?.split('T')[0])}</span>
                      <span style={{ fontSize: '12px', color: '#484F58' }}>{formatKO(match.kickoff_time)}</span>
                      {match.score_state > 1 && <span style={{ fontSize: '10px', color: '#185FA5', background: '#185FA520', padding: '1px 6px', borderRadius: '8px' }}>State {match.score_state}/6</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                    {topScore > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(topScore)}</div><div style={{ fontSize: '10px', color: '#484F58' }}>score</div></div>}
                    <span style={{ color: '#484F58', fontSize: '14px' }}>{isOpen ? 'v' : '>'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #2A3441', padding: '16px' }}>
                    {match.score && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, background: '#1E2530', borderRadius: '6px', padding: '12px', textAlign: 'center', border: homeScore > awayScore ? '1px solid #00C89640' : '1px solid transparent' }}>
                          <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>HOME ENGINE</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: homeScore > awayScore ? '#00C896' : '#E6EDF3' }}>{Math.round(homeScore)}</div>
                          <div style={{ fontSize: '11px', color: '#8B949E', marginTop: '2px' }}>{match.home_team}</div>
                        </div>
                        <div style={{ flex: 1, background: '#1E2530', borderRadius: '6px', padding: '12px', textAlign: 'center', border: awayScore > homeScore ? '1px solid #00C89640' : '1px solid transparent' }}>
                          <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>AWAY ENGINE</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: awayScore > homeScore ? '#00C896' : '#E6EDF3' }}>{Math.round(awayScore)}</div>
                          <div style={{ fontSize: '11px', color: '#8B949E', marginTop: '2px' }}>{match.away_team}</div>
                        </div>
                      </div>
                    )}
                    {preds ? (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#8B949E', marginBottom: '10px', letterSpacing: '0.5px' }}>MARKET PREDICTIONS</div>
                        <div style={{ background: '#1E2530', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>
                          {preds.summary.isClose ? <span style={{ color: '#f59e0b' }}>Too close to call - only {preds.summary.gap} point gap.</span>
                            : <span>Engine favours <span style={{ color: '#00C896', fontWeight: 700 }}>{preds.summary.favourite}</span> - {preds.summary.gap} point gap</span>}
                        </div>
                        <MarketRow title='MATCH RESULT' items={preds.match_result} colour='#00C896' />
                        <MarketRow title='BOTH TEAMS TO SCORE' items={preds.btts} colour='#185FA5' />
                        <MarketRow title='GOALS MARKET' items={preds.over_under} colour='#185FA5' />
                        {preds.anytime_scorer.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px', fontWeight: 600 }}>ANYTIME GOALSCORER</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {preds.anytime_scorer.map((p, i) => (
                                <div key={i} style={{ background: '#1E2530', border: '1px solid #2A3441', borderRadius: '6px', padding: '8px 10px', minWidth: '100px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                                  <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>{p.team}</div>
                                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{decToFrac(p.dec)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#484F58', marginTop: '4px' }}>Odds sourced from bookmakers. Always check current prices.</div>
                      </div>
                    ) : <div style={{ color: '#484F58', fontSize: '13px', marginBottom: '12px' }}>Run Score from Admin to generate predictions.</div>}
                    <div style={{ borderTop: '1px solid #1E2530', paddingTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px' }}>BET WITH:</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred'].map(n => (
                          <a key={n} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1E2530', border: '1px solid #2A3441', color: '#8B949E', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none' }}>{n}</a>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#484F58' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#484F58', textAlign: 'center' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#484F58' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}

function MarketRow({ title, items, colour }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px', fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {items.map(p => (
          <div key={p.label} style={{ flex: '1 1 100px', background: p.signal === 'strong' ? colour + '20' : '#1E2530', border: '1px solid ' + (p.signal === 'strong' ? colour + '60' : '#2A3441'), borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#8B949E', marginBottom: '4px' }}>{p.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.odds}</div>
            {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#00C896', fontWeight: 700, marginTop: '2px' }}>ENGINE PICK</div>}
          </div>
        ))}
      </div>
    </div>
  )
}