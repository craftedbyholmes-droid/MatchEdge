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
    <div className='me-page'>
      <h1 className='me-title' style={{ marginBottom: '20px' }}>Tipsters</h1>

      {/* Info box */}
      <div className='me-card' style={{ borderColor: '#00C89640', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#00C896', marginBottom: '4px' }}>When do picks go up?</div>
        <div className='me-sub' style={{ lineHeight: '1.6' }}>Gordon, Stan and Pez publish selections for the next matchday automatically. Picks appear as soon as fixtures are scored - often the evening before.</div>
      </div>

      {/* Season summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {Object.entries(PERSONA_META).map(([id, meta]) => {
          const s = getStats(id)
          const pl = Number(s.profit_loss || 0)
          const wr = s.total_picks > 0 ? Math.round(s.wins / s.total_picks * 100) : 0
          return (
            <div key={id} className='me-card' style={{ borderColor: meta.colour + '50' }}>
              <div style={{ color: meta.colour, fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>{meta.name}</div>
              <div className='me-muted' style={{ marginBottom: '8px' }}>{meta.market}</div>
              <div className='me-sub' style={{ marginBottom: '14px', lineHeight: '1.5' }}>{meta.bio}</div>
              <div className='me-flex' style={{ gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</div>
                  <div className='me-muted'>W/Total ({wr}%)</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : '-'}{GBP}{Math.abs(pl).toFixed(2)}</div>
                  <div className='me-muted'>Season P+L</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {plan === 'free' ? <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate> : (
        <>
          {/* Picks heading */}
          <div className='me-flex' style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>{formatPickDate(pickDate)} Picks</h2>
            {pickDate && pickDate !== today && (
              <span className='me-badge me-badge-gold'>EARLY PICKS</span>
            )}
          </div>

          {picks.length === 0 ? (
            <div className='me-card' style={{ textAlign: 'center', padding: '32px', marginBottom: '28px' }}>
              <div className='me-sub' style={{ marginBottom: '6px' }}>No picks generated yet</div>
              <div className='me-muted'>Picks generate automatically when the next matchday fixtures are scored.</div>
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
                      <div key={pick.pick_id} style={{ background: '#ffffff', border: '2px solid ' + meta.colour, borderRadius: '10px', padding: '16px', marginBottom: '10px', color: '#111' }}>
                        {/* Match */}
                        <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>
                          {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Upcoming Match'}
                        </div>
                        {(pick.league || pick.kickoff_time) && (
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            {pick.league}{pick.kickoff_time ? ' - ' + new Date(pick.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        )}
                        {/* Selection */}
                        <div className='me-flex-between' style={{ flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div className='me-flex' style={{ flexWrap: 'wrap', gap: '6px' }}>
                            {pick.is_best_pick && <span className='me-badge' style={{ background: '#F0B90B', color: '#000' }}>BEST PICK</span>}
                            <span style={{ fontWeight: 800, fontSize: '15px' }}>{pick.selection}</span>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: meta.colour }}>@ {pick.odds_fractional}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#555', flexWrap: 'wrap' }}>
                            <span>Score: <b style={{ color: '#111' }}>{pick.engine_score}</b></span>
                            <span>Stake: <b style={{ color: '#111' }}>{GBP}{pick.stake}</b></span>
                          </div>
                        </div>
                        {/* Tip text */}
                        {pick.tip_text && (
                          <div style={{ fontSize: '13px', color: '#444', fontStyle: 'italic', marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid ' + meta.colour }}>
                            {pick.tip_text}
                          </div>
                        )}
                        {/* Bookmakers */}
                        <div className='me-flex-wrap' style={{ paddingTop: '10px', borderTop: '1px solid #e5e5e5' }}>
                          <span style={{ fontSize: '11px', color: '#888', lineHeight: '26px' }}>Bet with:</span>
                          {BOOKMAKERS.map(bm => (
                            <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* History */}
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>Pick History</h2>
          <div className='me-flex-wrap' style={{ marginBottom: '18px' }}>
            {Object.entries(PERSONA_META).map(([id, meta]) => (
              <button key={id} className={'me-btn' + (activeTab === id ? ' me-btn-primary' : '')} onClick={() => setActiveTab(id)}
                style={{ background: activeTab === id ? meta.colour : undefined, borderColor: activeTab === id ? meta.colour : undefined, color: activeTab === id ? '#fff' : undefined }}>
                {meta.name}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (() => {
            const grouped = getHistory(activeTab)
            const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
            if (!dates.length) return (
              <div className='me-muted' style={{ padding: '20px 0' }}>No settled picks yet. History builds after each matchday settles.</div>
            )
            return dates.map(date => {
              const dayPicks = grouped[date]
              const dayPL = dayPicks.reduce((s, p) => s + Number(p.profit_loss || 0), 0)
              const dayWins = dayPicks.filter(p => p.outcome === 'win').length
              const pl = plFmt(dayPL, dayPL > 0 ? 'win' : dayPL < 0 ? 'loss' : null)
              return (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <div className='me-flex-between' style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #2A3441', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>
                      {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className='me-flex' style={{ gap: '10px' }}>
                      <span className='me-sub'>{dayWins}/{dayPicks.length} wins</span>
                      <span style={{ fontWeight: 700, color: pl.colour }}>{pl.text}</span>
                    </div>
                  </div>
                  {dayPicks.map(pick => {
                    const od = outcomeTag(pick.outcome)
                    const pld = plFmt(pick.profit_loss, pick.outcome)
                    return (
                      <div key={pick.pick_id} style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderLeft: '4px solid ' + od.bg, borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pick.home_team && pick.away_team ? pick.home_team + ' vs ' + pick.away_team : 'Match'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#444' }}>
                            {pick.selection} <span style={{ color: '#888' }}>@</span> <span style={{ fontWeight: 700, color: '#111' }}>{pick.odds_fractional}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{pick.league} · Stake: {GBP}{pick.stake}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ background: od.bg, color: od.colour, fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', marginBottom: '4px', display: 'inline-block' }}>{od.text}</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: pld.colour }}>{pld.text}</div>
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