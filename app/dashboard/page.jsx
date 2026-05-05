'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import Link from 'next/link'

export default function DashboardPage() {
  const { plan, user } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [picks, setPicks] = useState([])
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/personas/picks').then(r => r.json()).then(d => setPicks(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const highConf = matches.filter(m => (m.score?.total_home || 0) >= 75 || (m.score?.total_away || 0) >= 75).length
  const bestPick = picks.find(p => p.is_best_pick)
  const planColour = plan === 'edge' ? '#f0c040' : plan === 'pro' ? '#4d9fff' : '#6b7280'
  const planLabel = plan === 'edge' ? 'EDGE' : plan === 'pro' ? 'PRO' : 'FREE'

  async function handleRefresh() {
    if (plan !== 'edge') return
    setLoading(true)
    await fetch('/api/cron/cache', { headers: { 'authorization': 'Bearer ' + process.env.NEXT_PUBLIC_CRON_SECRET } })
    const d = await fetch('/api/matches').then(r => r.json())
    setMatches(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Today</h1>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{today}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ background: planColour + '20', color: planColour, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{planLabel}</span>
          {plan === 'edge' && <button onClick={handleRefresh} style={{ background: '#1c1c28', border: '1px solid #2a2a3a', color: '#ccc', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Refresh</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          ['Matches Today', matches.length],
          ['High Confidence', highConf],
          ['Tipster Picks', picks.length]
        ].map(([label, val]) => (
          <div key={label} style={{ flex: '1 1 120px', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{val}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {bestPick && (
        <div style={{ background: '#13131a', border: '1px solid #f0c04060', borderRadius: '8px', padding: '16px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0c040', letterSpacing: '1px', marginBottom: '6px' }}>BEST PICK TODAY</div>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{bestPick.selection}</div>
          <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>{bestPick.odds_fractional} — Score: {bestPick.engine_score}/100</div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>{bestPick.tip_text}</div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>No matches scheduled today.</div>
      ) : (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
            {plan === 'free' ? 'Top Pick' : 'All Matches'}
          </h2>
          {(plan === 'free' ? matches.slice(0,1) : matches).map(match => {
            const homeScore = match.score?.total_home || 0
            const awayScore = match.score?.total_away || 0
            const topScore = Math.max(homeScore, awayScore)
            const isHighConf = topScore >= 75
            const isBestBet = topScore >= 80
            const isOpen = expanded[match.fixture_id]
            return (
              <div key={match.fixture_id} style={{ background: '#13131a', border: '1px solid ' + (isHighConf ? '#f0c04040' : '#2a2a3a'), borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                <div onClick={() => toggle(match.fixture_id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team}</span>
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>vs</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>
                      {match.league} — {match.kickoff_time ? new Date(match.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'TBC'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {isBestBet && <span style={{ background: '#f0c04020', color: '#f0c040', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>BEST BET</span>}
                    {isHighConf && !isBestBet && <span style={{ background: '#22c55e20', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>HIGH CONF</span>}
                    {topScore > 0 && <span style={{ fontSize: '13px', fontWeight: 700, color: isHighConf ? '#f0c040' : '#9ca3af' }}>{Math.round(topScore)}</span>}
                    <span style={{ color: '#6b7280', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #2a2a3a', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>HOME SCORE</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{match.home_team}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>AWAY SCORE</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{match.away_team}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>MOMENTUM</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: match.score?.momentum_direction === 'home' ? '#22c55e' : '#4d9fff' }}>
                          {match.score?.momentum_direction === 'home' ? match.home_team : match.away_team}
                        </div>
                      </div>
                    </div>
                    {picks.filter(p => p.fixture_id === match.fixture_id).map(pick => (
                      <div key={pick.pick_id} style={{ background: '#1c1c28', borderRadius: '6px', padding: '10px 12px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: pick.persona === 'gordon' ? '#0F6E56' : pick.persona === 'stan' ? '#185FA5' : '#993C1D' }}>
                            {pick.persona === 'gordon' ? 'Gaffer Gordon' : pick.persona === 'stan' ? 'Stats Stan' : 'Punter Pez'}
                          </span>
                          {pick.is_best_pick && <span style={{ fontSize: '10px', background: '#f0c04020', color: '#f0c040', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>BEST PICK</span>}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{pick.selection} <span style={{ color: '#9ca3af', fontWeight: 400 }}>@ {pick.odds_fractional}</span></div>
                        {pick.tip_text && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>{pick.tip_text}</div>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'].map(b => (
                        <a key={b} href={process.env['NEXT_PUBLIC_AFF_' + b.replace(' ','').toUpperCase()] || '#'} target='_blank' rel='noopener noreferrer' style={{ fontSize: '11px', background: '#1c1c28', border: '1px solid #2a2a3a', color: '#9ca3af', padding: '4px 10px', borderRadius: '4px' }}>{b}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {plan === 'free' && matches.length > 1 && (
            <PlanGate requiredPlan='pro' currentPlan={plan}>
              <div />
            </PlanGate>
          )}
        </div>
      )}
      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}