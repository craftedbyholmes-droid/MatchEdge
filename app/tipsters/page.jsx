'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import LoadingSpinner from '@/components/LoadingSpinner'

const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: 'var(--primary)', market: 'Match Results',    bio: 'The ex-manager. Reads the game tactically. Trusts the unit scores.' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5', market: 'BTTS / Over-Under', bio: 'The data obsessive. Lives for BTTS and over/under. Never watches the game.' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D', market: 'Player Props',      bio: 'The instinctive one. Player props, cards, goalscorers. High risk, high reward.' }
}

const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']

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

  function getMatchName(pick) {
    if (pick.home_team && pick.away_team) return pick.home_team + ' vs ' + pick.away_team
    return pick.fixture_id ? pick.fixture_id.replace('sd_', 'Match ') : 'Unknown match'
  }

  function getStats(id) { return season.find(s => s.persona === id) || { wins: 0, total_picks: 0, profit_loss: 0 } }
  function getHistory(id) { return history.filter(h => h.persona === id) }
  function getPicks(id) { return picks.filter(p => p.persona === id) }
  const plColour = pl => pl > 0 ? 'var(--win)' : pl < 0 ? '#ef4444' : 'var(--text-secondary)'
  const outcomeColour = o => o === 'win' ? 'var(--win)' : o === 'loss' ? '#ef4444' : o === 'void' ? '#f59e0b' : 'var(--text-muted)'
  const outcomeLabel  = o => o === 'win' ? 'WIN' : o === 'loss' ? 'LOSS' : o === 'void' ? 'VOID' : 'PENDING'

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Tipsters</h1>

      <div style={{ background: 'var(--card)', border: '1px solid var(--primary)60', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>When do picks go up?</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Gordon, Stan and Pez publish selections for the next matchday automatically.
          Picks appear as soon as the next day fixtures are scored - often the evening before.
          The earlier you check, the better the odds available.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {Object.entries(PERSONA_META).map(([id, meta]) => {
          const s = getStats(id)
          const pl = Number(s.profit_loss || 0)
          const wr = s.total_picks > 0 ? Math.round((s.wins / s.total_picks) * 100) : 0
          return (
            <div key={id} style={{ flex: '1 1 260px', background: 'var(--card)', border: '1px solid ' + meta.colour + '40', borderRadius: '8px', padding: '18px' }}>
              <div style={{ color: meta.colour, fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>{meta.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>{meta.market}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>{meta.bio}</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div><div style={{ fontSize: '18px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>W/Total ({wr}%)</div></div>
                <div><div style={{ fontSize: '18px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : ''}£{Math.abs(pl).toFixed(2)}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Season P+L</div></div>
              </div>
            </div>
          )
        })}
      </div>

      {plan === 'free' ? (
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {pickDate ? formatPickDate(pickDate) + 's Picks' : 'Picks'}
            </h2>
            {pickDate && pickDate !== today && (
              <span style={{ fontSize: '11px', background: 'var(--gold)20', color: 'var(--gold)', border: '1px solid var(--gold)40', padding: '2px 10px', borderRadius: '10px', fontWeight: 700 }}>EARLY PICKS</span>
            )}
          </div>

          {picks.length === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '6px' }}>No picks generated yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Picks are generated automatically when the next matchday fixtures are scored.</div>
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              {Object.entries(PERSONA_META).map(([id, meta]) => {
                const personaPicks = getPicks(id)
                if (!personaPicks.length) return null
                return (
                  <div key={id} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: meta.colour, marginBottom: '8px', letterSpacing: '1px' }}>{meta.name.toUpperCase()}</div>
                    {personaPicks.map(pick => (
                      <div key={pick.pick_id} style={{ background: 'var(--card)', border: '1px solid ' + meta.colour + '30', borderRadius: '8px', padding: '14px 16px', marginBottom: '8px' }}>
                        {/* Match name - most important line */}
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: 'var(--text)' }}>
                          {getMatchName(pick)}
                        </div>
                        {/* League + kickoff */}
                        {(pick.league || pick.kickoff_time) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {pick.league}{pick.kickoff_time ? ' - ' + new Date(pick.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        )}
                        {/* Selection + odds */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {pick.is_best_pick && <span style={{ fontSize: '10px', background: 'var(--gold)20', color: 'var(--gold)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>BEST PICK</span>}
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{pick.selection}</span>
                            <span style={{ color: 'var(--win)', fontWeight: 700 }}>@ {pick.odds_fractional}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Score: {pick.engine_score}</span>
                            <span>Gap: {pick.score_gap}pts</span>
                            <span>Stake: £{pick.stake}</span>
                          </div>
                        </div>
                        {/* AI tip */}
                        {pick.tip_text && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px', paddingLeft: '8px', borderLeft: '2px solid ' + meta.colour + '40' }}>
                            {pick.tip_text}
                          </div>
                        )}
                        {/* Bookmaker links */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--card-raised)' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px', lineHeight: '26px' }}>Bet with:</span>
                          {BOOKMAKERS.map(bm => (
                            <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: 'var(--card-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none' }}>{bm}</a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Pick History</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {Object.entries(PERSONA_META).map(([id, meta]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '6px 16px', background: activeTab === id ? meta.colour : 'var(--card-raised)', color: activeTab === id ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (activeTab === id ? meta.colour : 'var(--border)'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {meta.name}
              </button>
            ))}
          </div>
          {loading ? <LoadingSpinner message='Loading history...' /> : getHistory(activeTab).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No settled picks yet. History builds after each matchday settles.</div>
          ) : (
            getHistory(activeTab).map(pick => (
              <div key={pick.pick_id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{getMatchName(pick)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pick.selection} @ {pick.odds_fractional}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{pick.pick_date} - {pick.league || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: outcomeColour(pick.outcome) }}>{outcomeLabel(pick.outcome)}</div>
                    <div style={{ fontSize: '11px', color: plColour(pick.profit_loss), marginTop: '2px' }}>{pick.profit_loss >= 0 ? '+' : ''}£{Number(pick.profit_loss || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
      <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: 'var(--text-muted)' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}