'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import LoadingSpinner from '@/components/LoadingSpinner'

const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: '#00C896' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D' }
}

const GBP = String.fromCharCode(163)

function fmt(n) {
  const v = Number(n) || 0
  if (v > 0) return { text: '+' + GBP + v.toFixed(2), colour: '#00C896' }
  if (v < 0) return { text: '-' + GBP + Math.abs(v).toFixed(2), colour: '#ef4444' }
  return { text: GBP + '0.00', colour: '#484F58' }
}

function outcomeTag(outcome) {
  if (outcome === 'win')  return { text: 'WIN',     bg: '#00C89620', colour: '#00C896', border: '#00C89640' }
  if (outcome === 'loss') return { text: 'LOSS',    bg: '#ef444420', colour: '#ef4444', border: '#ef444440' }
  if (outcome === 'void') return { text: 'VOID',    bg: '#F0B90B20', colour: '#F0B90B', border: '#F0B90B40' }
  return                         { text: 'PENDING', bg: '#2A3441',   colour: '#484F58', border: '#2A3441' }
}

function engineTag(home, away) {
  if (!home && !away) return null
  const gap = Math.abs(home - away)
  const fav = home > away ? 'Home' : 'Away'
  const col = gap >= 20 ? '#00C896' : gap >= 10 ? '#F0B90B' : '#484F58'
  return { text: fav + ' favoured (' + Math.round(gap) + 'pt gap)', colour: col }
}

function groupByMonthDayLeague(items, dateKey) {
  const out = {}
  for (const item of items) {
    const d = item[dateKey] ? item[dateKey].split('T')[0] : null
    if (!d) continue
    const month = d.substring(0, 7)
    const league = item.league || 'Other'
    if (!out[month]) out[month] = {}
    if (!out[month][d]) out[month][d] = {}
    if (!out[month][d][league]) out[month][d][league] = []
    out[month][d][league].push(item)
  }
  return out
}

function MonthLabel({ month }) {
  const [y, m] = month.split('-')
  const label = new Date(y, m - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return <div style={{ fontSize: '18px', fontWeight: 800, color: '#E6EDF3', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #2A3441' }}>{label}</div>
}

function DayLabel({ date, picks }) {
  const d = new Date(date + 'T12:00:00Z')
  const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const settled = picks.filter(p => p.outcome && p.outcome !== 'void')
  const wins = settled.filter(p => p.outcome === 'win').length
  const dayPL = picks.reduce((s, p) => s + (Number(p.profit_loss) || 0), 0)
  const pl = fmt(dayPL)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#8B949E' }}>{label}</div>
      {settled.length > 0 && (
        <div style={{ fontSize: '12px', color: '#484F58' }}>
          {wins}/{settled.length} wins
          <span style={{ marginLeft: '10px', fontWeight: 700, color: pl.colour }}>{pl.text}</span>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { plan } = usePlan()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tipsters')
  const [activePersona, setActivePersona] = useState('gordon')
  const [expandedMonths, setExpandedMonths] = useState({})

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
      // Auto-expand current month
      const thisMonth = new Date().toISOString().substring(0, 7)
      setExpandedMonths({ [thisMonth]: true })
    }).catch(() => setLoading(false))
  }, [])

  function toggleMonth(m) { setExpandedMonths(e => ({ ...e, [m]: !e[m] })) }

  const season = data?.season || []
  const allPicks = data?.recent || []
  const modelMatches = data?.model || []

  const totalPicks = season.reduce((s, p) => s + (p.total_picks || 0), 0)
  const totalWins  = season.reduce((s, p) => s + (p.wins || 0), 0)
  const totalPL    = season.reduce((s, p) => s + Number(p.profit_loss || 0), 0)
  const overallWR  = totalPicks > 0 ? Math.round(totalWins / totalPicks * 100) : 0
  const totalPLFmt = fmt(totalPL)

  const tabStyle = (active) => ({
    padding: '8px 18px',
    background: active ? '#00C896' : '#161B22',
    color: active ? '#0B0E11' : '#8B949E',
    border: '1px solid ' + (active ? '#00C896' : '#2A3441'),
    borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
  })

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Results</h1>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Total Picks',  value: totalPicks },
          { label: 'Winners',      value: totalWins },
          { label: 'Win Rate',     value: overallWR + '%' },
          { label: 'Season P+L',   value: totalPLFmt.text, colour: totalPLFmt.colour }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.colour || '#E6EDF3' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#484F58', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('tipsters')} style={tabStyle(activeTab === 'tipsters')}>Tipster Picks</button>
        <button onClick={() => setActiveTab('model')}    style={tabStyle(activeTab === 'model')}>Model Results</button>
        <button onClick={() => setActiveTab('league')}   style={tabStyle(activeTab === 'league')}>Tipster Competition</button>
      </div>

      {loading ? <LoadingSpinner message='Loading results...' /> : (
        <>
          {/* ===== TIPSTER PICKS TAB ===== */}
          {activeTab === 'tipsters' && (() => {
            const personaPicks = allPicks.filter(p => p.persona === activePersona)
            const grouped = groupByMonthDayLeague(personaPicks, 'pick_date')
            const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
            const s = season.find(x => x.persona === activePersona) || {}
            const pl = fmt(s.profit_loss)
            const wr = s.total_picks > 0 ? Math.round(s.wins / s.total_picks * 100) : 0
            return (
              <div>
                {/* Persona tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {Object.entries(PERSONA_META).map(([id, meta]) => (
                    <button key={id} onClick={() => setActivePersona(id)} style={{ padding: '6px 16px', background: activePersona === id ? meta.colour : '#161B22', color: activePersona === id ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activePersona === id ? meta.colour : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      {meta.name}
                    </button>
                  ))}
                </div>
                {/* Persona season summary */}
                <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div><span style={{ fontSize: '20px', fontWeight: 800, color: pl.colour }}>{pl.text}</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>Season P+L</span></div>
                  <div><span style={{ fontSize: '20px', fontWeight: 800 }}>{s.wins || 0}/{s.total_picks || 0}</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>W/Total ({wr}%)</span></div>
                  {s.total_staked > 0 && <div><span style={{ fontSize: '14px', color: '#484F58' }}>ROI: {Math.round((Number(s.profit_loss) / s.total_staked) * 100)}% | Staked: {GBP}{Number(s.total_staked).toFixed(2)}</span></div>}
                </div>
                {/* Month > Day > League > Picks */}
                {months.length === 0 ? (
                  <div style={{ color: '#484F58', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>No settled picks yet for {PERSONA_META[activePersona]?.name}.</div>
                ) : months.map(month => (
                  <div key={month} style={{ marginBottom: '24px' }}>
                    <div onClick={() => toggleMonth(month)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedMonths[month] ? '12px' : '0' }}>
                      <MonthLabel month={month} />
                      <span style={{ color: '#484F58', fontSize: '14px', marginTop: '-12px' }}>{expandedMonths[month] ? 'v' : '>'}</span>
                    </div>
                    {expandedMonths[month] && Object.keys(grouped[month]).sort((a,b) => b.localeCompare(a)).map(date => {
                      const dayAllPicks = Object.values(grouped[month][date]).flat()
                      return (
                        <div key={date}>
                          <DayLabel date={date} picks={dayAllPicks} />
                          {Object.entries(grouped[month][date]).sort().map(([league, lPicks]) => (
                            <div key={league} style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '4px' }}>{league}</div>
                              {lPicks.map(pick => {
                                const od = outcomeTag(pick.outcome)
                                const pl2 = fmt(pick.profit_loss)
                                return (
                                  <div key={pick.pick_id} style={{ background: '#161B22', border: '1px solid ' + od.border, borderRadius: '8px', padding: '12px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>
                                        {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Unknown match'}
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#8B949E' }}>
                                        {pick.selection}
                                        <span style={{ color: '#484F58', margin: '0 6px' }}>@</span>
                                        <span style={{ fontWeight: 600, color: '#E6EDF3' }}>{pick.odds_fractional}</span>
                                        <span style={{ color: '#484F58', marginLeft: '8px' }}>Stake: {GBP}{pick.stake}</span>
                                        {pick.is_best_pick && <span style={{ marginLeft: '8px', background: '#F0B90B20', color: '#F0B90B', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px' }}>BEST PICK</span>}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                      <div style={{ background: od.bg, color: od.colour, border: '1px solid ' + od.border, fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '12px', marginBottom: '4px', display: 'inline-block' }}>{od.text}</div>
                                      <div style={{ fontSize: '14px', fontWeight: 800, color: pl2.colour }}>{pl2.text}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })()}

          {/* ===== MODEL RESULTS TAB ===== */}
          {activeTab === 'model' && (() => {
            const grouped = groupByMonthDayLeague(modelMatches, 'kickoff_time')
            const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
            const correct = modelMatches.filter(m => {
              if (!m.score) return false
              const pred = m.score.total_home > m.score.total_away ? 'home' : m.score.total_away > m.score.total_home ? 'away' : 'draw'
              const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw'
              return pred === actual
            }).length
            const accPct = modelMatches.length > 0 ? Math.round(correct / modelMatches.length * 100) : 0
            return (
              <div>
                <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: '20px', fontWeight: 800 }}>{modelMatches.length}</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>Scored matches</span></div>
                  <div><span style={{ fontSize: '20px', fontWeight: 800, color: accPct >= 60 ? '#00C896' : accPct >= 50 ? '#F0B90B' : '#ef4444' }}>{accPct}%</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>Prediction accuracy</span></div>
                  <div><span style={{ fontSize: '14px', color: '#484F58' }}>{correct}/{modelMatches.length} correct results predicted</span></div>
                </div>
                {months.length === 0 ? (
                  <div style={{ color: '#484F58', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>No completed matches yet.</div>
                ) : months.map(month => (
                  <div key={month} style={{ marginBottom: '24px' }}>
                    <div onClick={() => toggleMonth('m_' + month)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <MonthLabel month={month} />
                      <span style={{ color: '#484F58', fontSize: '14px', marginTop: '-12px' }}>{expandedMonths['m_' + month] ? 'v' : '>'}</span>
                    </div>
                    {expandedMonths['m_' + month] && Object.keys(grouped[month]).sort((a,b) => b.localeCompare(a)).map(date => (
                      <div key={date}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#8B949E', marginBottom: '8px', marginTop: '16px' }}>
                          {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        {Object.entries(grouped[month][date]).sort().map(([league, lMatches]) => (
                          <div key={league} style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '4px' }}>{league}</div>
                            {lMatches.map(match => {
                              const pred = match.score?.total_home > match.score?.total_away ? 'home' : match.score?.total_away > match.score?.total_home ? 'away' : 'draw'
                              const actual = match.home_score > match.away_score ? 'home' : match.away_score > match.home_score ? 'away' : 'draw'
                              const correct2 = pred === actual
                              const eng = engineTag(match.score?.total_home, match.score?.total_away)
                              return (
                                <div key={match.fixture_id} style={{ background: '#161B22', border: '1px solid ' + (correct2 ? '#00C89640' : '#ef444430'), borderRadius: '8px', padding: '12px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{match.home_team} vs {match.away_team}</div>
                                    <div style={{ fontSize: '13px', color: '#8B949E', marginBottom: '3px' }}>
                                      Result: <span style={{ fontWeight: 700, color: '#E6EDF3' }}>{match.home_score} - {match.away_score}</span>
                                    </div>
                                    {eng && <div style={{ fontSize: '12px', color: eng.colour }}>{eng.text}</div>}
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ background: correct2 ? '#00C89620' : '#ef444420', color: correct2 ? '#00C896' : '#ef4444', border: '1px solid ' + (correct2 ? '#00C89640' : '#ef444440'), fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '12px', marginBottom: '4px', display: 'inline-block' }}>{correct2 ? 'CORRECT' : 'WRONG'}</div>
                                    {match.score && <div style={{ fontSize: '12px', color: '#484F58' }}>Engine: {Math.round(match.score.total_home)} vs {Math.round(match.score.total_away)}</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })()}

          {/* ===== TIPSTER COMPETITION TAB ===== */}
          {activeTab === 'league' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(PERSONA_META).map(([id, meta]) => {
                  const s = season.find(x => x.persona === id) || {}
                  const pl = fmt(s.profit_loss)
                  const wr = s.total_picks > 0 ? Math.round(s.wins / s.total_picks * 100) : 0
                  const rank = Object.entries(PERSONA_META)
                    .map(([pid]) => ({ pid, pl: Number(season.find(x => x.persona === pid)?.profit_loss || 0) }))
                    .sort((a, b) => b.pl - a.pl)
                    .findIndex(x => x.pid === id) + 1
                  return (
                    <div key={id} style={{ flex: '1 1 260px', background: '#161B22', border: '1px solid ' + meta.colour + '40', borderRadius: '10px', padding: '20px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '11px', fontWeight: 800, color: rank === 1 ? '#F0B90B' : '#484F58' }}>{rank === 1 ? 'LEADING' : '#' + rank}</div>
                      <div style={{ color: meta.colour, fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>{meta.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 900, color: pl.colour }}>{pl.text}</div>
                          <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Season P+L</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 900 }}>{wr}%</div>
                          <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Win Rate</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700 }}>{s.wins || 0}/{s.total_picks || 0}</div>
                          <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>W / Total</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700 }}>{s.total_staked > 0 ? Math.round((Number(s.profit_loss) / s.total_staked) * 100) + '%' : '-'}</div>
                          <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>ROI</div>
                        </div>
                      </div>
                      {s.total_staked > 0 && <div style={{ fontSize: '12px', color: '#484F58', borderTop: '1px solid #2A3441', paddingTop: '10px' }}>Total staked: {GBP}{Number(s.total_staked).toFixed(2)} | Voids: {s.voids || 0}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}