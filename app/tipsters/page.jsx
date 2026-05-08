'use client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: '#0F6E56', market: 'Match Results',  bio: 'The ex-manager. Reads the game tactically. Trusts the unit scores.' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5', market: 'BTTS / Over-Under', bio: 'The data obsessive. Lives for BTTS and over/under. Never watches the game.' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D', market: 'Player Props',   bio: 'The instinctive one. Player props, cards, goalscorers. High risk, high reward.' }
}

export default function TipstersPage() {
  const { plan } = usePlan()
  const [season, setSeason]   = useState([])
  const [picks, setPicks]     = useState([])
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
      if (arr.length > 0) setPickDate(arr[0].pick_date)
    }).catch(() => {})
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  function formatPickDate(d) {
    if (!d) return 'Next Matchday'
    if (d === today) return 'Today'
    if (d === tomorrow) return 'Tomorrow'
    return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getStats(id) { return season.find(s => s.persona === id) || { wins: 0, total_picks: 0, profit_loss: 0 } }
  function getHistory(id) { return history.filter(h => h.persona === id) }
  function getPicks(id) { return picks.filter(p => p.persona === id) }
  const plColour = pl => pl > 0 ? '#22c55e' : pl < 0 ? '#ef4444' : '#9ca3af'
  const outcomeColour = o => o === 'win' ? '#22c55e' : o === 'loss' ? '#ef4444' : o === 'void' ? '#f59e0b' : '#6b7280'
  const outcomeLabel  = o => o === 'win' ? 'WIN' : o === 'loss' ? 'LOSS' : o === 'void' ? 'VOID' : 'PENDING'

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Tipsters</h1>

      {/* When do picks go up notice */}
      <div style={{ background: '#13131a', border: '1px solid #0F6E5660', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F6E56', marginBottom: '6px' }}>When do picks go up?</div>
        <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
          Gordon, Stan and Pez publish selections for the next matchday automatically.
          Picks appear here as soon as the next day fixtures are scored - often the evening before.
          The earlier you check, the better the odds available.
        </div>
      </div>

      {/* Persona summary cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {Object.entries(PERSONA_META).map(([id, meta]) => {
          const s = getStats(id)
          const pl = Number(s.profit_loss || 0)
          const wr = s.total_picks > 0 ? Math.round((s.wins / s.total_picks) * 100) : 0
          return (
            <div key={id} style={{ flex: '1 1 260px', background: '#13131a', border: '1px solid ' + meta.colour + '40', borderRadius: '8px', padding: '18px' }}>
              <div style={{ color: meta.colour, fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{meta.name}</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '10px' }}>{meta.market}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>{meta.bio}</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div><div style={{ fontSize: '18px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>W/Total ({wr}%)</div></div>
                <div><div style={{ fontSize: '18px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : ''}£{Math.abs(pl).toFixed(2)}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Season P+L</div></div>
              </div>
            </div>
          )
        })}
      </div>

      {plan === 'free' ? (
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      ) : (
        <>
          {/* Picks section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {pickDate ? formatPickDate(pickDate) + "'s Picks" : "Today's Picks"}
            </h2>
            {pickDate && pickDate !== today && (
              <span style={{ fontSize: '11px', background: '#f0c04020', color: '#f0c040', border: '1px solid #f0c04040', padding: '2px 10px', borderRadius: '10px', fontWeight: 700 }}>
                EARLY PICKS
              </span>
            )}
          </div>

          {picks.length === 0 ? (
            <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>No picks generated yet</div>
              <div style={{ fontSize: '12px', color: '#4b5563' }}>Picks are generated automatically when the next matchday fixtures are scored.</div>
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              {Object.entries(PERSONA_META).map(([id, meta]) => {
                const personaPicks = getPicks(id)
                if (!personaPicks.length) return null
                return (
                  <div key={id} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: meta.colour, marginBottom: '8px', letterSpacing: '1px' }}>{meta.name.toUpperCase()}</div>
                    {personaPicks.map(pick => (
                      <div key={pick.pick_id} style={{ background: '#13131a', border: '1px solid ' + meta.colour + '30', borderRadius: '8px', padding: '14px 16px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {pick.is_best_pick && <span style={{ fontSize: '10px', background: '#f0c04020', color: '#f0c040', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>BEST PICK</span>}
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Score: {pick.engine_score} - Gap: {pick.score_gap}pts</span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#4b5563' }}>Stake: £{pick.stake}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                          {pick.selection}
                          <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '13px', marginLeft: '8px' }}>@ {pick.odds_fractional}</span>
                        </div>
                        {pick.tip_text && <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>{pick.tip_text}</div>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pick history */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Pick History</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {Object.entries(PERSONA_META).map(([id, meta]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '6px 16px', background: activeTab === id ? meta.colour : '#1c1c28', color: activeTab === id ? '#fff' : '#9ca3af', border: '1px solid ' + (activeTab === id ? meta.colour : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {meta.name}
              </button>
            ))}
          </div>
          {loading ? <LoadingSpinner /> : getHistory(activeTab).length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>No settled picks yet. History builds after each matchday settles.</div>
          ) : (
            getHistory(activeTab).map(pick => (
              <div key={pick.pick_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#13131a', borderRadius: '6px', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{pick.selection}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{pick.pick_date} - {pick.odds_fractional}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: outcomeColour(pick.outcome) }}>{outcomeLabel(pick.outcome)}</div>
                  <div style={{ fontSize: '11px', color: plColour(pick.profit_loss), marginTop: '2px' }}>{pick.profit_loss >= 0 ? '+' : ''}£{Number(pick.profit_loss || 0).toFixed(2)}</div>
                </div>
              </div>
            ))
          )}
        </>
      )}
      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}