'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

export default function TomorrowPage() {
  const { plan } = usePlan()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    fetch('/api/tomorrow').then(r => r.json()).then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  if (plan === 'free') {
    return (
      <div style={{ paddingBottom: '60px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Tomorrow</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{tomorrow}</p>
        <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Tomorrow</h1>
        <div style={{ color: '#6b7280', fontSize: '13px' }}>{tomorrow} — Provisional scores</div>
      </div>
      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        Scores are provisional — based on season stats before lineups are confirmed.
      </div>
      {loading ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
      ) : matches.length === 0 ? (
        <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>No matches scheduled tomorrow.</div>
      ) : (
        matches.map(match => {
          const homeScore = match.score?.total_home || 0
          const awayScore = match.score?.total_away || 0
          const topScore = Math.max(homeScore, awayScore)
          const isOpen = expanded[match.fixture_id]
          return (
            <div key={match.fixture_id} style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', marginBottom: '10px' }}>
              <div onClick={() => toggle(match.fixture_id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team} vs {match.away_team}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>{match.league} — {match.kickoff_time ? new Date(match.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'TBC'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {topScore > 0 && <span style={{ fontSize: '13px', fontWeight: 700, color: topScore >= 75 ? '#f0c040' : '#9ca3af' }}>{Math.round(topScore)}</span>}
                  <span style={{ color: '#6b7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid #2a2a3a', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>HOME</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{match.home_team}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>AWAY</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{match.away_team}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>PROVISIONAL — updates when lineups confirmed</div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}