'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']
const LEAGUE_META = {
  'Bundesliga':    { colour: '#d00',    label: 'Bundesliga (German)' },
  'La Liga':       { colour: '#c60',    label: 'La Liga (Spanish)' },
  'Ligue 1':       { colour: '#004494',label: 'Ligue 1 (French)' },
  'Premier League':{ colour: '#3d195b',label: 'Premier League (English)' },
  'Premiership':   { colour: '#005EB8',label: 'Premiership (Scottish)' },
  'Serie A':       { colour: '#0066cc',label: 'Serie A (Italian)' }
}

// Convert decimal odds to fractional string
function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.2)  return '1/5'
  if (n < 0.3)  return '2/7'
  if (n < 0.4)  return '1/3'
  if (n < 0.5)  return '4/9'
  if (n < 0.6)  return '4/7'
  if (n < 0.7)  return '8/13'
  if (n < 0.8)  return '4/6'
  if (n < 0.95) return '5/6'
  if (n < 1.05) return 'Evs'
  if (n < 1.2)  return '11/10'
  if (n < 1.35) return '6/5'
  if (n < 1.55) return '11/8'
  if (n < 1.7)  return '6/4'
  if (n < 1.9)  return '7/4'
  if (n < 2.1)  return '2/1'
  if (n < 2.4)  return '9/4'
  if (n < 2.7)  return '5/2'
  if (n < 3.1)  return '3/1'
  if (n < 3.6)  return '7/2'
  if (n < 4.1)  return '4/1'
  if (n < 4.6)  return '9/2'
  if (n < 5.5)  return '5/1'
  if (n < 6.5)  return '6/1'
  if (n < 7.5)  return '7/1'
  if (n < 8.5)  return '8/1'
  if (n < 10)   return '9/1'
  return Math.round(n) + '/1'
}

// Get attackers and midfielders for goalscorer market
function getGoalscorerCandidates(lineup) {
  if (!lineup || !lineup.length) return []
  return lineup.filter(p => ['Attacker','Midfielder'].includes(p.position)).map(p => p.player.name)
}

// Build all predictions from real odds and engine scores
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
  const isClose = gap < 8

  // Use real odds if available, otherwise derive from engine scores
  const homeWinDec = realOdds?.match_winner?.home || (home > away ? (gap > 20 ? 1.5 : gap > 10 ? 1.8 : 2.2) : (gap > 15 ? 3.5 : 2.8))
  const drawDec    = realOdds?.match_winner?.draw || (isClose ? 3.2 : gap > 20 ? 5.0 : 3.8)
  const awayWinDec = realOdds?.match_winner?.away || (away > home ? (gap > 20 ? 1.5 : gap > 10 ? 1.8 : 2.2) : (gap > 15 ? 3.5 : 2.8))
  const ouTotal    = realOdds?.over_under?.total || 2.5
  const overDec    = realOdds?.over_under?.over || 1.9
  const underDec   = realOdds?.over_under?.under || 1.9
  const hcapMkt    = realOdds?.handicap?.market
  const hcapHomeDec= realOdds?.handicap?.home
  const hcapAwayDec= realOdds?.handicap?.away

  // Signal strength - draw is only strong if gap < 5
  const homeSignal = home > away + 15 ? 'strong' : home > away + 5 ? 'mild' : 'weak'
  const drawSignal = gap < 5 ? 'mild' : 'weak'
  const awaySignal = away > home + 15 ? 'strong' : away > home + 5 ? 'mild' : 'weak'
  const combined = home + away
  const overSignal = combined > 110 ? 'strong' : combined > 104 ? 'mild' : 'weak'
  const underSignal = combined < 96 ? 'strong' : combined < 102 ? 'mild' : 'weak'

  // BTTS - derived from combined score and real over/under line
  const bttsYesDec = ouTotal >= 3.5 ? 1.65 : ouTotal >= 2.5 ? 1.85 : 2.1
  const bttsNoDec  = ouTotal >= 3.5 ? 2.1  : ouTotal >= 2.5 ? 1.95 : 1.72
  const bttsSignal = combined > 108 ? 'strong' : combined > 102 ? 'mild' : 'weak'

  // Goalscorer candidates from real lineups
  const homeAttackers = getGoalscorerCandidates(homeLineup)
  const awayAttackers = getGoalscorerCandidates(awayLineup)
  const allAttackers = [
    ...homeAttackers.slice(0, 4).map(n => ({ name: n, team: match.home_team, side: 'home' })),
    ...awayAttackers.slice(0, 4).map(n => ({ name: n, team: match.away_team, side: 'away' }))
  ]
  // Assign anytime scorer odds based on position in lineup (attackers shorter)
  const scorerOdds = [1.8, 2.2, 2.5, 3.0, 2.5, 3.0, 3.5, 4.0]

  return {
    match_result: [
      { label: match.home_team + ' Win', odds: decToFrac(homeWinDec), dec: homeWinDec, signal: homeSignal },
      { label: 'Draw',                   odds: decToFrac(drawDec),    dec: drawDec,    signal: drawSignal },
      { label: match.away_team + ' Win', odds: decToFrac(awayWinDec), dec: awayWinDec, signal: awaySignal }
    ],
    btts: [
      { label: 'BTTS Yes', odds: decToFrac(bttsYesDec), dec: bttsYesDec, signal: bttsSignal },
      { label: 'BTTS No',  odds: decToFrac(bttsNoDec),  dec: bttsNoDec,  signal: combined < 96 ? 'strong' : 'weak' }
    ],
    over_under: [
      { label: 'Over ' + ouTotal + ' Goals',  odds: decToFrac(overDec),  dec: overDec,  signal: overSignal },
      { label: 'Under ' + ouTotal + ' Goals', odds: decToFrac(underDec), dec: underDec, signal: underSignal }
    ],
    handicap: hcapMkt != null ? [
      { label: match.home_team + ' ' + (hcapMkt >= 0 ? '+' : '') + hcapMkt, odds: decToFrac(hcapHomeDec), dec: hcapHomeDec, signal: homeSignal },
      { label: match.away_team + ' ' + (hcapMkt >= 0 ? '-' : '+') + Math.abs(hcapMkt), odds: decToFrac(hcapAwayDec), dec: hcapAwayDec, signal: awaySignal }
    ] : null,
    anytime_scorer: allAttackers.map((p, i) => ({
      name: p.name,
      team: p.team,
      side: p.side,
      odds: decToFrac(scorerOdds[i] || 4.0),
      signal: p.side === (home >= away ? 'home' : 'away') && i < 2 ? 'strong' : 'mild'
    })),
    hasLineups: allAttackers.length > 0,
    summary: { favourite, gap: Math.round(gap), isClose, homeScore: Math.round(home), awayScore: Math.round(away) }
  }
}

export default function UpcomingPage() {
  const { plan } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [activeLeague, setActiveLeague] = useState('Bundesliga')

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      const valid = (Array.isArray(d) ? d : []).filter(m =>
        m.home_team && m.away_team &&
        m.home_team !== 'Unknown' && m.away_team !== 'Unknown' &&
        m.home_team !== 'None' && m.away_team !== 'None' &&
        m.home_team.trim() !== '' && m.away_team.trim() !== ''
      )
      setMatches(valid)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const byLeague = {}
  LEAGUE_ORDER.forEach(l => { byLeague[l] = [] })
  matches.forEach(m => { if (byLeague[m.league]) byLeague[m.league].push(m) })
  LEAGUE_ORDER.forEach(l => {
    byLeague[l].sort((a, b) => Math.max(b.score?.total_home||0, b.score?.total_away||0) - Math.max(a.score?.total_home||0, a.score?.total_away||0))
  })

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  function formatDate(d) { if (!d) return 'TBC'; if (d === today) return 'Today'; if (d === tomorrow) return 'Tomorrow'; return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
  function formatKO(kt) { if (!kt) return 'TBC'; return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function getBadge(score) { if (!score) return null; const t = Math.max(score.total_home||0, score.total_away||0); if (t >= 80) return { label: 'BEST BET', colour: '#f0c040' }; if (t >= 75) return { label: 'HIGH CONF', colour: '#22c55e' }; return null }

  if (plan === 'free') return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Upcoming Fixtures</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Early engine scores and bet predictions across 6 European leagues.</p>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Real odds and engine predictions. Highest confidence first. Click any match for full markets.</p>
      </div>
      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Provisional scores — update automatically as injuries and lineups are confirmed.
      </div>

      {/* League tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {LEAGUE_ORDER.map(l => {
          const meta = LEAGUE_META[l]
          const count = byLeague[l]?.length || 0
          return (
            <button key={l} onClick={() => setActiveLeague(l)} style={{ padding: '7px 14px', background: activeLeague === l ? meta.colour : '#1c1c28', color: '#fff', border: '1px solid ' + (activeLeague === l ? meta.colour : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{meta.label}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {loading ? <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading fixtures...</div> : byLeague[activeLeague]?.length === 0 ? (
        <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>No upcoming fixtures for {LEAGUE_META[activeLeague]?.label}.</div>
          <div style={{ color: '#4b5563', fontSize: '12px', marginTop: '6px' }}>Use the Admin panel to fetch fixtures.</div>
        </div>
      ) : (
        <div>
          <div style={{ background: LEAGUE_META[activeLeague]?.colour, borderRadius: '8px 8px 0 0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{LEAGUE_META[activeLeague]?.label}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{byLeague[activeLeague].length} matches</div>
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
              <div key={match.fixture_id} style={{ background: '#13131a', border: '1px solid ' + (badge ? badge.colour + '40' : '#2a2a3a'), borderTop: 'none', borderRadius: isLast && !isOpen ? '0 0 8px 8px' : '0', overflow: 'hidden' }}>
                <div onClick={() => toggle(match.fixture_id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                      <span style={{ color: '#4b5563', fontSize: '12px' }}>vs</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(match.kickoff_time?.split('T')[0])}</span>
                      <span style={{ fontSize: '12px', color: '#4b5563' }}>{formatKO(match.kickoff_time)}</span>
                      {match.score_state > 1 && <span style={{ fontSize: '10px', color: '#185FA5', background: '#185FA520', padding: '1px 6px', borderRadius: '8px' }}>State {match.score_state}/6</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                    {topScore > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#9ca3af', lineHeight: 1 }}>{Math.round(topScore)}</div><div style={{ fontSize: '10px', color: '#4b5563' }}>score</div></div>}
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid #2a2a3a', padding: '16px' }}>

                    {/* Engine scores */}
                    {match.score && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '12px', textAlign: 'center', border: homeScore > awayScore ? '1px solid #22c55e40' : '1px solid transparent' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>HOME ENGINE</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{match.home_team}</div>
                        </div>
                        <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '12px', textAlign: 'center', border: awayScore > homeScore ? '1px solid #22c55e40' : '1px solid transparent' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>AWAY ENGINE</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{match.away_team}</div>
                        </div>
                      </div>
                    )}

                    {preds ? (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', letterSpacing: '0.5px' }}>MARKET PREDICTIONS</div>

                        {/* Summary */}
                        <div style={{ background: '#1c1c28', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px' }}>
                          {preds.summary.isClose
                            ? <span style={{ color: '#f59e0b' }}>Too close to call — engine gap only {preds.summary.gap} points. Avoid match result market.</span>
                            : <span>Engine strongly favours <span style={{ color: '#22c55e', fontWeight: 700 }}>{preds.summary.favourite}</span> — {preds.summary.gap} point gap</span>
                          }
                        </div>

                        {/* Match result */}
                        <MarketSection title='MATCH RESULT' items={preds.match_result} colour='#0F6E56' />

                        {/* BTTS */}
                        <MarketSection title='BOTH TEAMS TO SCORE' items={preds.btts} colour='#185FA5' />

                        {/* Over/Under */}
                        <MarketSection title={'GOALS MARKET (' + (match.score?.modifiers?.odds?.over_under?.total || 2.5) + ' line)'} items={preds.over_under} colour='#185FA5' />

                        {/* Handicap */}
                        {preds.handicap && <MarketSection title='ASIAN HANDICAP' items={preds.handicap} colour='#993C1D' />}

                        {/* Anytime scorers */}
                        {preds.anytime_scorer.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>ANYTIME GOALSCORER</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {preds.anytime_scorer.map((p, i) => (
                                <div key={i} style={{ background: p.signal === 'strong' ? '#f0c04015' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? '#f0c04060' : '#2a2a3a'), borderRadius: '6px', padding: '8px 12px', minWidth: '120px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>{p.team}</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: p.signal === 'strong' ? '#f0c040' : '#e8e8f0' }}>{p.odds}</div>
                                  {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#f0c040', fontWeight: 700, marginTop: '2px' }}>ENGINE PICK</div>}
                                </div>
                              ))}
                            </div>
                            {!preds.hasLineups && <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '6px' }}>Player names will appear when projected lineups are available.</div>}
                          </div>
                        )}

                        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
                          Odds sourced from bookmakers via SoccerData. Always check current prices before betting. ENGINE PICK = strongest signal only.
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>Run Score from Admin panel to generate predictions.</div>
                    )}

                    {/* Bookmaker links */}
                    <div style={{ borderTop: '1px solid #1c1c28', paddingTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>BET WITH:</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'].map(name => (
                          <a key={name} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1c1c28', border: '1px solid #2a2a3a', color: '#9ca3af', padding: '5px 12px', borderRadius: '4px', fontSize: '12px' }}>{name}</a>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563' }}>18+ | Please gamble responsibly | BeGambleAware.org</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}

function MarketSection({ title, items, colour }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {items.map(p => (
          <div key={p.label} style={{ flex: '1 1 120px', background: p.signal === 'strong' ? colour + '20' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? colour + '60' : '#2a2a3a'), borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: p.signal === 'strong' ? '#fff' : '#e8e8f0' }}>{p.odds}</div>
            {p.signal === 'strong' && <div style={{ fontSize: '9px', color: colour === '#0F6E56' ? '#22c55e' : '#4d9fff', marginTop: '2px', fontWeight: 700 }}>ENGINE PICK</div>}
          </div>
        ))}
      </div>
    </div>
  )
}