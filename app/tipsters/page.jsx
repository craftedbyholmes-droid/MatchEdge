'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import LoadingSpinner from '@/components/LoadingSpinner'

const GBP = String.fromCharCode(163)

const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: '#00C896', market: 'Match Results',    bio: 'The ex-manager. Reads the game tactically. Trusts the unit scores.' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5', market: 'BTTS / Over-Under', bio: 'The data obsessive. Lives for BTTS and over/under. Never watches the game.' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D', market: 'Player Props',      bio: 'The instinctive one. Player props, cards, goalscorers. High risk, high reward.' }
}

const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']

function outcomeTag(outcome) {
  if (outcome === 'win')  return { text: 'WIN',     bg: '#00C896', colour: '#fff' }
  if (outcome === 'loss') return { text: 'LOSS',    bg: '#ef4444', colour: '#fff' }
  if (outcome === 'void') return { text: 'VOID',    bg: '#F0B90B', colour: '#000' }
  return                         { text: 'PENDING', bg: '#2A3441', colour: '#8B949E' }
}

function plFmt(pl, outcome) {
  if (outcome === 'void') return { text: GBP + '0.00 (void)', colour: '#F0B90B' }
  if (!outcome) return { text: 'Pending', colour: '#484F58' }
  const v = Number(pl) || 0
  if (v > 0) return { text: '+' + GBP + v.toFixed(2), colour: '#00C896' }
  if (v < 0) return { text: '-' + GBP + Math.abs(v).toFixed(2), colour: '#ef4444' }
  return { text: GBP + '0.00', colour: '#484F58' }
}

export default function TipstersPage() {
  const { plan } = usePlan()
  const [season, setSeason] = useState([])
  const [picks, setPicks] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('gordon')
  const [loading, setLoading] = useState(true)
  const [pickDate, setPickDate] = useState(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setSeason(d.season || [])
      setHistory(d.recent || [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetch('/api/personas/picks').then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : []
      setPicks(arr)
      if (arr.length) setPickDate(arr[0].pick_date)
    }).catch(() => {})
  }, [])

  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  function formatPickDate(d) {
    if (!d) return 'Next Matchday'
    if (d === today) return 'Today'
    if (d === tomorrow) return 'Tomorrow'
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getStats(id)   { return season.find(s => s.persona === id) || { wins:0, total_picks:0, profit_loss:0, total_staked:0 } }
  function getPicks(id)   { return picks.filter(p => p.persona === id) }

  function getHistory(id) {
    const h = history.filter(p => p.persona === id && p.outcome)
    // Group by date
    const byDate = {}
    for (const p of h) {
      const d = p.pick_date
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(p)
    }
    return byDate
  }

  const plColour = pl => Number(pl) > 0 ? '#00C896' : Number(pl) < 0 ? '#ef4444' : '#484F58'

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Tipsters</h1>

      {/* Info box */}
      <div style={{ background: '#161B22', border: '1px solid #00C89640', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#00C896', marginBottom: '4px' }}>When do picks go up?</div>
        <div style={{ fontSize: '13px', color: '#8B949E', lineHeight: '1.6' }}>Gordon, Stan and Pez publish selections for the next matchday automatically. Picks appear as soon as fixtures are scored - often the evening before.</div>
      </div>

      {/* Season summary cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {Object.entries(PERSONA_META).map(([id, meta]) => {
          const s = getStats(id)
          const pl = Number(s.profit_loss || 0)
          const wr = s.total_picks > 0 ? Math.round(s.wins / s.total_picks * 100) : 0
          return (
            <div key={id} style={{ flex: '1 1 240px', background: '#161B22', border: '1px solid ' + meta.colour + '50', borderRadius: '10px', padding: '18px' }}>
              <div style={{ color: meta.colour, fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>{meta.name}</div>
              <div style={{ color: '#484F58', fontSize: '12px', marginBottom: '10px' }}>{meta.market}</div>
              <div style={{ color: '#8B949E', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>{meta.bio}</div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#E6EDF3' }}>{s.wins}/{s.total_picks}</div>
                  <div style={{ fontSize: '11px', color: '#484F58' }}>W/Total ({wr}%)</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : '-'}{GBP}{Math.abs(pl).toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: '#484F58' }}>Season P+L</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {plan === 'free' ? <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate> : (
        <>
          {/* Today picks heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
              {formatPickDate(pickDate)} Picks
            </h2>
            {pickDate && pickDate !== today && (
              <span style={{ fontSize: '11px', background: '#F0B90B20', color: '#F0B90B', border: '1px solid #F0B90B40', padding: '2px 10px', borderRadius: '10px', fontWeight: 700 }}>EARLY PICKS</span>
            )}
          </div>

          {picks.length === 0 ? (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '32px', textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '14px', color: '#8B949E', marginBottom: '6px' }}>No picks generated yet</div>
              <div style={{ fontSize: '12px', color: '#484F58' }}>Picks generate automatically when the next matchday fixtures are scored.</div>
            </div>
          ) : (
            <div style={{ marginBottom: '32px' }}>
              {Object.entries(PERSONA_META).map(([id, meta]) => {
                const personaPicks = getPicks(id)
                if (!personaPicks.length) return null
                return (
                  <div key={id} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: meta.colour, marginBottom: '10px', letterSpacing: '1.5px' }}>{meta.name.toUpperCase()}</div>
                    {personaPicks.map(pick => (
                      <div key={pick.pick_id} style={{
                        background: '#ffffff',
                        border: '2px solid ' + meta.colour,
                        borderRadius: '10px',
                        padding: '16px 18px',
                        marginBottom: '10px',
                        color: '#111'
                      }}>
                        {/* Match name */}
                        <div style={{ fontWeight: 800, fontSize: '16px', color: '#111', marginBottom: '3px' }}>
                          {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Upcoming Match'}
                        </div>
                        {/* League + time */}
                        {(pick.league || pick.kickoff_time) && (
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            {pick.league}
                            {pick.kickoff_time ? ' - ' + new Date(pick.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        )}
                        {/* Selection row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {pick.is_best_pick && (
                              <span style={{ background: '#F0B90B', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>BEST PICK</span>
                            )}
                            <span style={{ fontWeight: 800, fontSize: '15px', color: '#111' }}>{pick.selection}</span>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: meta.colour }}>@ {pick.odds_fractional}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#555' }}>
                            <span>Score: <b style={{ color: '#111' }}>{pick.engine_score}</b></span>
                            <span>Gap: <b style={{ color: '#111' }}>{pick.score_gap}pts</b></span>
                            <span>Stake: <b style={{ color: '#111' }}>{GBP}{pick.stake}</b></span>
                          </div>
                        </div>
                        {/* AI tip */}
                        {pick.tip_text && (
                          <div style={{ fontSize: '13px', color: '#444', fontStyle: 'italic', marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid ' + meta.colour }}>
                            {pick.tip_text}
                          </div>
                        )}
                        {/* Bookmaker links */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #e5e5e5' }}>
                          <span style={{ fontSize: '11px', color: '#888', lineHeight: '26px', marginRight: '4px' }}>Bet with:</span>
                          {BOOKMAKERS.map(bm => (
                            <a key={bm} href='#' target='_blank' rel='noopener noreferrer'
                              style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>
                              {bm}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pick History */}
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>Pick History</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {Object.entries(PERSONA_META).map(([id, meta]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '7px 16px', background: activeTab === id ? meta.colour : '#161B22', color: activeTab === id ? '#fff' : '#8B949E', border: '1px solid ' + (activeTab === id ? meta.colour : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                {meta.name}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (() => {
            const grouped = getHistory(activeTab)
            const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
            if (!dates.length) return (
              <div style={{ color: '#484F58', fontSize: '14px', padding: '20px 0' }}>
                No settled picks yet. History builds after each matchday settles.
              </div>
            )
            return dates.map(date => {
              const dayPicks = grouped[date]
              const dayPL = dayPicks.reduce((s, p) => s + Number(p.profit_loss || 0), 0)
              const dayWins = dayPicks.filter(p => p.outcome === 'win').length
              const pl = plFmt(dayPL, dayPL > 0 ? 'win' : dayPL < 0 ? 'loss' : null)
              return (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #2A3441' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3' }}>
                      {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: '#8B949E' }}>{dayWins}/{dayPicks.length} wins</span>
                      <span style={{ marginLeft: '10px', fontWeight: 700, color: pl.colour }}>{pl.text}</span>
                    </div>
                  </div>
                  {dayPicks.map(pick => {
                    const od = outcomeTag(pick.outcome)
                    const pld = plFmt(pick.profit_loss, pick.outcome)
                    return (
                      <div key={pick.pick_id} style={{
                        background: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderLeft: '4px solid ' + (od.bg === '#2A3441' ? '#2A3441' : od.bg),
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '2px' }}>
                            {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Match'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#444' }}>
                            {pick.selection}
                            <span style={{ color: '#888', margin: '0 5px' }}>@</span>
                            <span style={{ fontWeight: 700, color: '#111' }}>{pick.odds_fractional}</span>
                            <span style={{ color: '#888', marginLeft: '8px' }}>{pick.league}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Stake: {GBP}{pick.stake}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ background: od.bg, color: od.colour, fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '10px', marginBottom: '4px', display: 'inline-block' }}>{od.text}</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: pld.colour }}>{pld.text}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          })()}
        </>
      )}

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#8B949E' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}