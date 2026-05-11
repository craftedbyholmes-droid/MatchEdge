'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import LoadingSpinner from '@/components/LoadingSpinner'

const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: '#00C896' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D' }
}

export default function ResultsPage() {
  const { plan } = usePlan()
  const [picks, setPicks] = useState([])
  const [season, setSeason] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tipsters')
  const [activePersona, setActivePersona] = useState('gordon')

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setSeason(d.season || [])
      setPicks(d.recent || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function getStats(id) {
    return season.find(s => s.persona === id) || { wins: 0, losses: 0, voids: 0, total_picks: 0, total_staked: 0, profit_loss: 0 }
  }

  // Group picks by date then league
  function groupPicks(personaId) {
    const filtered = picks.filter(p => p.persona === personaId)
    const byDate = {}
    for (const pick of filtered) {
      const date = pick.pick_date
      if (!byDate[date]) byDate[date] = {}
      const league = pick.league || 'Other'
      if (!byDate[date][league]) byDate[date][league] = []
      byDate[date][league].push(pick)
    }
    return byDate
  }

  function formatDate(d) {
    if (!d) return 'Unknown'
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function plDisplay(pl, outcome) {
    const n = Number(pl) || 0
    if (outcome === 'void') return { text: 'VOID', colour: '#F0B90B' }
    if (outcome === 'pending' || outcome === null) return { text: 'PENDING', colour: '#484F58' }
    if (n > 0) return { text: '+' + n.toFixed(2), colour: '#00C896' }
    if (n < 0) return { text: '-' + Math.abs(n).toFixed(2), colour: '#ef4444' }
    return { text: '0.00', colour: '#484F58' }
  }

  function outcomeDisplay(outcome) {
    if (outcome === 'win')  return { text: 'WIN',     colour: '#00C896' }
    if (outcome === 'loss') return { text: 'LOSS',    colour: '#ef4444' }
    if (outcome === 'void') return { text: 'VOID',    colour: '#F0B90B' }
    return                         { text: 'PENDING', colour: '#484F58' }
  }

  const plColour = pl => Number(pl) > 0 ? '#00C896' : Number(pl) < 0 ? '#ef4444' : '#484F58'

  // Overall stats across all personas
  const totalPicks  = season.reduce((s, p) => s + (p.total_picks || 0), 0)
  const totalWins   = season.reduce((s, p) => s + (p.wins || 0), 0)
  const totalPL     = season.reduce((s, p) => s + Number(p.profit_loss || 0), 0)
  const overallWR   = totalPicks > 0 ? Math.round((totalWins / totalPicks) * 100) : 0

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Results</h1>

      {/* Overall stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Total Picks', value: totalPicks },
          { label: 'Winners',     value: totalWins },
          { label: 'Win Rate',    value: overallWR + '%' },
          { label: 'Season P+L',  value: (totalPL >= 0 ? '+' : '-') + 'GBP' + Math.abs(totalPL).toFixed(2), colour: plColour(totalPL) }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.colour || '#E6EDF3' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#484F58', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('tipsters')} style={{ padding: '8px 18px', background: activeTab === 'tipsters' ? '#00C896' : '#161B22', color: activeTab === 'tipsters' ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activeTab === 'tipsters' ? '#00C896' : '#2A3441'), borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Tipster Competition</button>
        <button onClick={() => setActiveTab('history')}  style={{ padding: '8px 18px', background: activeTab === 'history'  ? '#00C896' : '#161B22', color: activeTab === 'history'  ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activeTab === 'history'  ? '#00C896' : '#2A3441'), borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Pick History</button>
      </div>

      {loading ? <LoadingSpinner message='Loading results...' /> : (
        <>
          {/* TIPSTER COMPETITION TAB */}
          {activeTab === 'tipsters' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {Object.entries(PERSONA_META).map(([id, meta]) => {
                  const s = getStats(id)
                  const pl = Number(s.profit_loss || 0)
                  const wr = s.total_picks > 0 ? Math.round((s.wins / s.total_picks) * 100) : 0
                  return (
                    <div key={id} style={{ flex: '1 1 260px', background: '#161B22', border: '1px solid ' + meta.colour + '40', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ color: meta.colour, fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>{meta.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div><div style={{ fontSize: '20px', fontWeight: 800 }}>{wr}%</div><div style={{ fontSize: '11px', color: '#484F58' }}>Win Rate</div></div>
                        <div><div style={{ fontSize: '20px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</div><div style={{ fontSize: '11px', color: '#484F58' }}>W/Total</div></div>
                        <div><div style={{ fontSize: '20px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : '-'}GBP{Math.abs(pl).toFixed(2)}</div><div style={{ fontSize: '11px', color: '#484F58' }}>P+L</div></div>
                      </div>
                      {s.total_staked > 0 && (
                        <div style={{ fontSize: '12px', color: '#484F58' }}>
                          ROI: {Math.round((pl / s.total_staked) * 100)}% | Staked: GBP{Number(s.total_staked).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PICK HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              {/* Persona selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {Object.entries(PERSONA_META).map(([id, meta]) => (
                  <button key={id} onClick={() => setActivePersona(id)} style={{ padding: '6px 16px', background: activePersona === id ? meta.colour : '#161B22', color: activePersona === id ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activePersona === id ? meta.colour : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    {meta.name}
                  </button>
                ))}
              </div>

              {/* Running P+L for selected persona */}
              {(() => {
                const s = getStats(activePersona)
                const pl = Number(s.profit_loss || 0)
                return s.total_picks > 0 ? (
                  <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div><span style={{ fontSize: '18px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : '-'}GBP{Math.abs(pl).toFixed(2)}</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>Season P+L</span></div>
                    <div><span style={{ fontSize: '18px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</span><span style={{ fontSize: '12px', color: '#484F58', marginLeft: '8px' }}>W/Total ({s.total_picks > 0 ? Math.round(s.wins/s.total_picks*100) : 0}%)</span></div>
                    {s.total_staked > 0 && <div><span style={{ fontSize: '14px', color: '#484F58' }}>ROI: {Math.round((pl/s.total_staked)*100)}%</span></div>}
                  </div>
                ) : null
              })()}

              {/* Picks grouped by date > league */}
              {(() => {
                const grouped = groupPicks(activePersona)
                const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
                if (!dates.length) return (
                  <div style={{ color: '#484F58', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                    No settled picks yet for {PERSONA_META[activePersona]?.name}.
                  </div>
                )
                return dates.map(date => (
                  <div key={date} style={{ marginBottom: '28px' }}>
                    {/* Date header */}
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8B949E', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #2A3441', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{formatDate(date)}</span>
                      {(() => {
                        const dayPicks = Object.values(grouped[date]).flat()
                        const dayPL = dayPicks.reduce((s, p) => s + Number(p.profit_loss || 0), 0)
                        const dayWins = dayPicks.filter(p => p.outcome === 'win').length
                        return (
                          <span style={{ fontSize: '12px', color: plColour(dayPL) }}>
                            {dayWins}/{dayPicks.length} wins | {dayPL >= 0 ? '+' : '-'}GBP{Math.abs(dayPL).toFixed(2)}
                          </span>
                        )
                      })()}
                    </div>
                    {/* Leagues within this date */}
                    {Object.entries(grouped[date]).sort().map(([league, leaguePicks]) => (
                      <div key={league} style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{league}</div>
                        {leaguePicks.map(pick => {
                          const od = outcomeDisplay(pick.outcome)
                          const pl = plDisplay(pick.profit_loss, pick.outcome)
                          return (
                            <div key={pick.pick_id} style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '12px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                                  {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Match ' + pick.fixture_id}
                                </div>
                                <div style={{ fontSize: '13px', color: '#8B949E' }}>
                                  {pick.selection}
                                  <span style={{ color: '#484F58', margin: '0 6px' }}>@</span>
                                  <span style={{ fontWeight: 600 }}>{pick.odds_fractional}</span>
                                  <span style={{ color: '#484F58', marginLeft: '8px' }}>Stake: GBP{pick.stake}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: od.colour, marginBottom: '2px' }}>{od.text}</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: pl.colour }}>{pl.colour === '#484F58' ? '' : (Number(pick.profit_loss) >= 0 ? '' : '')}{pl.text}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))
              })()}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}