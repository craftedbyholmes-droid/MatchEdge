'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import Link from 'next/link'

function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.4) return '1/3'
  if (n < 0.6) return '4/7'
  if (n < 0.8) return '4/6'
  if (n < 0.95) return '5/6'
  if (n < 1.05) return 'Evs'
  if (n < 1.35) return '6/5'
  if (n < 1.7) return '6/4'
  if (n < 2.1) return '2/1'
  if (n < 2.7) return '5/2'
  if (n < 3.1) return '3/1'
  if (n < 4.1) return '4/1'
  if (n < 5.5) return '5/1'
  return Math.round(n) + '/1'
}

export default function CompetitionFixturesPage({ params }) {
  const { id } = params
  const searchParams = useSearchParams()
  const compName = searchParams.get('name') || 'Competition'
  const { plan } = usePlan()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [activeGroup, setActiveGroup] = useState('all')

  useEffect(() => {
    if (!id) return
    fetch('/api/competitions/fixtures?league_id=' + id)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function toggle(fid) { setExpanded(e => ({ ...e, [fid]: !e[fid] })) }

  const fixtures = data?.fixtures || []
  const comp = data?.competition
  const hasGroups = comp?.hasGroups && fixtures.some(f => f.group_id)

  // Group by date
  const byDate = fixtures.reduce((acc, f) => {
    const d = f.kickoff_time ? f.kickoff_time.split('T')[0] : f.date || 'TBC'
    if (!acc[d]) acc[d] = []
    acc[d].push(f)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  // Group by group stage if applicable
  const groups = hasGroups ? [...new Set(fixtures.map(f => f.group_id).filter(Boolean))].sort() : []

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  function formatDate(d) {
    if (!d || d === 'TBC') return 'TBC'
    if (d === today) return 'Today'
    if (d === tomorrow) return 'Tomorrow'
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  function formatKO(kt) { if (!kt) return 'TBC'; return new Date(kt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  function getBadge(score) { if (!score) return null; const t = Math.max(score.total_home||0, score.total_away||0); if (t >= 80) return { label: 'BEST BET', colour: '#F0B90B' }; if (t >= 75) return { label: 'HIGH CONF', colour: '#00C896' }; return null }
  const colour = comp?.colour || '#00C896'

  if (plan === 'free') return (
    <div style={{ paddingBottom: '60px' }}>
      <Link href='/competitions' style={{ color: '#484F58', fontSize: '13px' }}>← Competitions</Link>
      <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '12px 0 6px' }}>{compName}</h1>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Link href='/competitions' style={{ color: '#484F58', fontSize: '13px' }}>← All Competitions</Link>

      {/* Header */}
      <div style={{ background: colour, borderRadius: '8px', padding: '16px 20px', margin: '12px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{compName}</h1>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>This week's fixtures — engine scores and predictions</div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: 'rgba(255,255,255,0.9)' }}>{fixtures.length}</div>
      </div>

      {/* Group filter for tournaments */}
      {hasGroups && groups.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button onClick={() => setActiveGroup('all')} style={{ padding: '5px 12px', background: activeGroup === 'all' ? colour : '#1E2530', color: '#fff', border: '1px solid ' + (activeGroup === 'all' ? colour : '#2A3441'), borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>All Groups</button>
          {groups.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)} style={{ padding: '5px 12px', background: activeGroup === g ? colour : '#1E2530', color: '#fff', border: '1px solid ' + (activeGroup === g ? colour : '#2A3441'), borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Group {g}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#484F58', padding: '40px 0', textAlign: 'center' }}>Loading fixtures...</div>
      ) : fixtures.length === 0 ? (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: '#484F58', fontSize: '14px', marginBottom: '8px' }}>No fixtures this week for {compName}.</div>
          <div style={{ color: '#484F58', fontSize: '12px' }}>Check back when the next round of fixtures is scheduled.</div>
        </div>
      ) : (
        dates.map(date => {
          const dayFixtures = byDate[date].filter(f => activeGroup === 'all' || f.group_id === activeGroup)
          if (!dayFixtures.length) return null
          return (
            <div key={date} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#8B949E', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{formatDate(date)}</span>
                <span style={{ fontSize: '11px', color: '#484F58', background: '#1E2530', padding: '2px 8px', borderRadius: '10px' }}>{dayFixtures.length} {dayFixtures.length === 1 ? 'match' : 'matches'}</span>
              </div>
              {dayFixtures.map(match => {
                const fid = match.fixture_id || ('sd_' + match.sd_match_id)
                const homeScore = match.score?.total_home || 0
                const awayScore = match.score?.total_away || 0
                const topScore = Math.max(homeScore, awayScore)
                const badge = getBadge(match.score)
                const isOpen = expanded[fid]
                const mods = match.score?.modifiers || {}
                const realOdds = mods.odds || null
                const homeWinDec = realOdds?.match_winner?.home
                const drawDec = realOdds?.match_winner?.draw
                const awayWinDec = realOdds?.match_winner?.away
                const ouTotal = realOdds?.over_under?.total || 2.5
                const overDec = realOdds?.over_under?.over
                const underDec = realOdds?.over_under?.under
                const gap = Math.abs(homeScore - awayScore)
                const homeSignal = homeScore > awayScore + 15 ? 'strong' : homeScore > awayScore + 5 ? 'mild' : 'weak'
                const drawSignal = gap < 5 ? 'mild' : 'weak'
                const awaySignal = awayScore > homeScore + 15 ? 'strong' : awayScore > homeScore + 5 ? 'mild' : 'weak'
                return (
                  <div key={fid} style={{ background: '#161B22', border: '1px solid ' + (badge ? badge.colour + '40' : '#2A3441'), borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                    <div onClick={() => toggle(fid)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                          {match.group_id && <span style={{ fontSize: '10px', background: colour + '30', color: colour, padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>Group {match.group_id}</span>}
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                          <span style={{ color: '#484F58', fontSize: '12px' }}>vs</span>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#484F58' }}>{formatDate(date)} — {formatKO(match.kickoff_time)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                        {badge && <span style={{ background: badge.colour + '20', color: badge.colour, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>}
                        {topScore > 0 && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '18px', fontWeight: 900, color: badge ? badge.colour : '#8B949E', lineHeight: 1 }}>{Math.round(topScore)}</div><div style={{ fontSize: '10px', color: '#484F58' }}>score</div></div>}
                        <span style={{ color: '#484F58' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2A3441', padding: '16px' }}>
                        {match.score ? (
                          <>
                            {/* Engine scores */}
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
                            {/* Summary */}
                            <div style={{ background: '#1E2530', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px' }}>
                              {gap < 8
                                ? <span style={{ color: '#f59e0b' }}>Close contest — only {Math.round(gap)} point gap. Treat all markets with caution.</span>
                                : <span>Engine favours <span style={{ color: '#00C896', fontWeight: 700 }}>{homeScore > awayScore ? match.home_team : match.away_team}</span> — {Math.round(gap)} point gap</span>
                              }
                            </div>
                            {/* Match result */}
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px', fontWeight: 600 }}>MATCH RESULT</div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[
                                  { label: match.home_team + ' Win', dec: homeWinDec, signal: homeSignal, fallbackDec: homeScore > awayScore ? (gap > 15 ? 1.6 : 2.0) : 3.2 },
                                  { label: 'Draw', dec: drawDec, signal: drawSignal, fallbackDec: gap < 5 ? 3.0 : 3.8 },
                                  { label: match.away_team + ' Win', dec: awayWinDec, signal: awaySignal, fallbackDec: awayScore > homeScore ? (gap > 15 ? 1.6 : 2.0) : 3.2 }
                                ].map(p => (
                                  <div key={p.label} style={{ flex: 1, background: p.signal === 'strong' ? '#00C89620' : '#1E2530', border: '1px solid ' + (p.signal === 'strong' ? '#00C89660' : '#2A3441'), borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#8B949E', marginBottom: '4px' }}>{p.label}</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{decToFrac(p.dec || p.fallbackDec)}</div>
                                    {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#00C896', fontWeight: 700, marginTop: '2px' }}>ENGINE PICK</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Goals */}
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px', fontWeight: 600 }}>GOALS ({ouTotal} line)</div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[
                                  { label: 'Over ' + ouTotal, dec: overDec, signal: (homeScore + awayScore) > 110 ? 'strong' : 'weak', fallbackDec: 1.9 },
                                  { label: 'Under ' + ouTotal, dec: underDec, signal: (homeScore + awayScore) < 96 ? 'strong' : 'weak', fallbackDec: 1.9 }
                                ].map(p => (
                                  <div key={p.label} style={{ flex: 1, background: p.signal === 'strong' ? '#185FA520' : '#1E2530', border: '1px solid ' + (p.signal === 'strong' ? '#185FA560' : '#2A3441'), borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#8B949E', marginBottom: '4px' }}>{p.label}</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{decToFrac(p.dec || p.fallbackDec)}</div>
                                    {p.signal === 'strong' && <div style={{ fontSize: '9px', color: '#4d9fff', fontWeight: 700, marginTop: '2px' }}>ENGINE PICK</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#484F58', fontSize: '13px', marginBottom: '12px' }}>Engine score not yet calculated. Run Score from Admin panel.</div>
                        )}
                        {/* Bookmakers */}
                        <div style={{ borderTop: '1px solid #1E2530', paddingTop: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#484F58', marginBottom: '6px' }}>BET WITH:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'].map(name => (
                              <a key={name} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1E2530', border: '1px solid #2A3441', color: '#8B949E', padding: '5px 12px', borderRadius: '4px', fontSize: '12px' }}>{name}</a>
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
          )
        })
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#484F58', textAlign: 'center' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#484F58' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}