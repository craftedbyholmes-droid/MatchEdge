'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']

const LEAGUE_META = {
  'Bundesliga':    { colour: '#d00',     label: 'Bundesliga',                flag: 'DE' },
  'La Liga':       { colour: '#c60',     label: 'La Liga',                   flag: 'ES' },
  'Ligue 1':       { colour: '#004494', label: 'Ligue 1',                   flag: 'FR' },
  'Premier League':{ colour: '#3d195b', label: 'Premier League (English)',   flag: 'EN' },
  'Premiership':   { colour: '#005EB8', label: 'Premiership (Scottish)',     flag: 'SC' },
  'Serie A':       { colour: '#0066cc', label: 'Serie A',                   flag: 'IT' }
}

const MARKET_LABELS = {
  match_result: 'Match Result',
  btts: 'Both Teams To Score',
  over_25: 'Over 2.5 Goals',
  under_25: 'Under 2.5 Goals',
  ht_result: 'Half Time Result',
  double_chance: 'Double Chance',
  asian_hcap: 'Asian Handicap',
  anytime_scorer: 'Anytime Goalscorer',
  cards: 'Card Markets'
}

export default function UpcomingPage() {
  const { plan } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [activeLeague, setActiveLeague] = useState('Bundesliga')

  useEffect(() => {
    fetch('/api/upcoming').then(r => r.json()).then(d => {
      const valid = (Array.isArray(d) ? d : []).filter(m => m.home_team && m.away_team && m.home_team !== 'Unknown' && m.away_team !== 'Unknown' && m.home_team !== 'None' && m.away_team !== 'None')
      setMatches(valid)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const byLeague = {}
  LEAGUE_ORDER.forEach(l => { byLeague[l] = [] })
  matches.forEach(m => { if (byLeague[m.league]) byLeague[m.league].push(m) })
  LEAGUE_ORDER.forEach(l => {
    byLeague[l].sort((a, b) => {
      const aS = Math.max(a.score?.total_home || 0, a.score?.total_away || 0)
      const bS = Math.max(b.score?.total_home || 0, b.score?.total_away || 0)
      return bS - aS
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

  function getMatchDate(kt) { return kt ? kt.split('T')[0] : 'TBC' }

  function getBadge(score) {
    if (!score) return null
    const top = Math.max(score.total_home || 0, score.total_away || 0)
    if (top >= 80) return { label: 'BEST BET', colour: '#f0c040' }
    if (top >= 75) return { label: 'HIGH CONF', colour: '#22c55e' }
    return null
  }

  function getPredictions(match) {
    const home = match.score?.total_home || 0
    const away = match.score?.total_away || 0
    if (!home && !away) return null
    const gap = Math.abs(home - away)
    const favourite = home >= away ? match.home_team : match.away_team
    const underdog = home >= away ? match.away_team : match.home_team
    const favScore = Math.max(home, away)
    const combined = home + away
    const homeWinOdds = home > away ? (home > 75 ? '4/6' : home > 65 ? 'Evs' : '6/4') : (away - home > 10 ? '7/2' : '2/1')
    const drawOdds = gap < 8 ? '9/4' : gap < 15 ? '3/1' : '4/1'
    const awayWinOdds = away > home ? (away > 75 ? '4/6' : away > 65 ? 'Evs' : '6/4') : (home - away > 10 ? '7/2' : '2/1')
    const bttsYes = combined > 110 ? '4/7' : combined > 100 ? '5/6' : '10/11'
    const bttsNo = combined > 110 ? '6/4' : combined > 100 ? '11/10' : 'Evs'
    const over25 = combined > 108 ? '4/6' : combined > 100 ? '5/6' : '11/10'
    const under25 = combined > 108 ? '6/4' : combined > 100 ? '11/10' : '4/6'
    return {
      match_result: [
        { label: match.home_team + ' Win', odds: homeWinOdds, signal: home > away + 5 ? 'strong' : home > away ? 'mild' : 'weak' },
        { label: 'Draw', odds: drawOdds, signal: gap < 8 ? 'mild' : 'weak' },
        { label: match.away_team + ' Win', odds: awayWinOdds, signal: away > home + 5 ? 'strong' : away > home ? 'mild' : 'weak' }
      ],
      btts: [
        { label: 'BTTS Yes', odds: bttsYes, signal: combined > 108 ? 'strong' : 'mild' },
        { label: 'BTTS No', odds: bttsNo, signal: combined <= 100 ? 'strong' : 'mild' }
      ],
      over_under: [
        { label: 'Over 2.5 Goals', odds: over25, signal: combined > 108 ? 'strong' : 'mild' },
        { label: 'Under 2.5 Goals', odds: under25, signal: combined <= 100 ? 'strong' : 'mild' }
      ],
      double_chance: [
        { label: match.home_team + ' or Draw', odds: '1/4', signal: home >= away ? 'strong' : 'weak' },
        { label: match.away_team + ' or Draw', odds: '2/5', signal: away >= home ? 'strong' : 'weak' },
        { label: match.home_team + ' or ' + match.away_team, odds: '1/5', signal: gap > 10 ? 'strong' : 'mild' }
      ],
      summary: { favourite, favScore, gap: Math.round(gap), isClose: gap < 8 }
    }
  }

  if (plan === 'free') {
    return (
      <div style={{ paddingBottom: '60px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Early engine scores and bet predictions across 6 European leagues.</p>
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Upcoming Fixtures</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Early engine scores and bet predictions. Highest confidence first. Click any match for full markets.</p>
      </div>

      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Provisional scores — update automatically as injuries and lineups are confirmed.
      </div>

      {/* League selector tabs - no All Leagues */}
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

      {loading ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading fixtures...</div>
      ) : byLeague[activeLeague]?.length === 0 ? (
        <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>No upcoming fixtures for {LEAGUE_META[activeLeague]?.label}.</div>
          <div style={{ color: '#4b5563', fontSize: '12px', marginTop: '6px' }}>Use the Admin panel to fetch fixtures.</div>
        </div>
      ) : (
        <div>
          {/* League header */}
          <div style={{ background: LEAGUE_META[activeLeague]?.colour || '#1c1c28', borderRadius: '8px 8px 0 0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{LEAGUE_META[activeLeague]?.label}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{byLeague[activeLeague].length} matches — sorted by engine score</div>
          </div>

          {byLeague[activeLeague].map((match, idx) => {
            const homeScore = match.score?.total_home || 0
            const awayScore = match.score?.total_away || 0
            const topScore = Math.max(homeScore, awayScore)
            const badge = getBadge(match.score)
            const isOpen = expanded[match.fixture_id]
            const preds = getPredictions(match)
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
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(getMatchDate(match.kickoff_time))}</span>
                      <span style={{ fontSize: '12px', color: '#4b5563' }}>{formatKickoff(match.kickoff_time)}</span>
                      {match.score_state > 1 && <span style={{ fontSize: '10px', color: '#185FA5', background: '#185FA520', padding: '1px 6px', borderRadius: '8px' }}>State {match.score_state}/6</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                    {topScore > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#9ca3af', lineHeight: 1 }}>{Math.round(topScore)}</div>
                        <div style={{ fontSize: '10px', color: '#4b5563' }}>score</div>
                      </div>
                    )}
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid #2a2a3a', padding: '16px' }}>

                    {/* Engine scores */}
                    {match.score && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '12px', textAlign: 'center', border: homeScore > awayScore ? '1px solid #22c55e40' : '1px solid #1c1c28' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>HOME</div>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginTop: '2px' }}>{match.home_team}</div>
                        </div>
                        <div style={{ flex: 1, background: '#1c1c28', borderRadius: '6px', padding: '12px', textAlign: 'center', border: awayScore > homeScore ? '1px solid #22c55e40' : '1px solid #1c1c28' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>AWAY</div>
                          <div style={{ fontSize: '26px', fontWeight: 900, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginTop: '2px' }}>{match.away_team}</div>
                        </div>
                      </div>
                    )}

                    {/* Early predictions */}
                    {preds && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', letterSpacing: '0.5px' }}>EARLY PREDICTIONS</div>

                        {/* Summary signal */}
                        <div style={{ background: '#1c1c28', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>
                          {preds.summary.isClose ? (
                            <span style={{ color: '#f59e0b' }}>Close contest — engine sees this as too tight to call with confidence</span>
                          ) : (
                            <span>Engine favours <span style={{ color: '#22c55e', fontWeight: 700 }}>{preds.summary.favourite}</span> — score gap of <span style={{ fontWeight: 700 }}>{preds.summary.gap} points</span></span>
                          )}
                        </div>

                        {/* Match result */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>MATCH RESULT</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {preds.match_result.map(p => (
                              <div key={p.label} style={{ flex: '1 1 120px', background: p.signal === 'strong' ? '#0F6E5620' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? '#0F6E5660' : '#2a2a3a'), borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: p.signal === 'strong' ? '#22c55e' : '#e8e8f0' }}>{p.odds}</div>
                                {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px', fontWeight: 700 }}>ENGINE PICK</div>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* BTTS */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>BOTH TEAMS TO SCORE</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {preds.btts.map(p => (
                              <div key={p.label} style={{ flex: 1, background: p.signal === 'strong' ? '#185FA520' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? '#185FA560' : '#2a2a3a'), borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: p.signal === 'strong' ? '#4d9fff' : '#e8e8f0' }}>{p.odds}</div>
                                {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#4d9fff', marginTop: '2px', fontWeight: 700 }}>ENGINE PICK</div>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Over/Under */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>GOALS MARKET</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {preds.over_under.map(p => (
                              <div key={p.label} style={{ flex: 1, background: p.signal === 'strong' ? '#185FA520' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? '#185FA560' : '#2a2a3a'), borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: p.signal === 'strong' ? '#4d9fff' : '#e8e8f0' }}>{p.odds}</div>
                                {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#4d9fff', marginTop: '2px', fontWeight: 700 }}>ENGINE PICK</div>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Double chance */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: 600 }}>DOUBLE CHANCE</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {preds.double_chance.map(p => (
                              <div key={p.label} style={{ flex: '1 1 140px', background: p.signal === 'strong' ? '#0F6E5620' : '#1c1c28', border: '1px solid ' + (p.signal === 'strong' ? '#0F6E5660' : '#2a2a3a'), borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.odds}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '8px' }}>
                          Odds are indicative only. Always check bookmakers for current prices. Engine picks highlight strongest signals only.
                        </div>
                      </div>
                    )}

                    {/* No score yet */}
                    {!match.score && (
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
                        Engine score not yet calculated. Run Score from Admin panel.
                      </div>
                    )}

                    {/* Bookmaker links */}
                    <div style={{ borderTop: '1px solid #1c1c28', paddingTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>BET WITH:</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[['Bet365','NEXT_PUBLIC_AFF_BET365'],['William Hill','NEXT_PUBLIC_AFF_WILLIAMHILL'],['Ladbrokes','NEXT_PUBLIC_AFF_LADBROKES'],['Coral','NEXT_PUBLIC_AFF_CORAL'],['Paddy Power','NEXT_PUBLIC_AFF_PADDYPOWER'],['Betfred','NEXT_PUBLIC_AFF_BETFRED']].map(([name]) => (
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