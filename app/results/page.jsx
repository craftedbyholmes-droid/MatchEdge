'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

export default function ResultsPage() {
  const { plan } = usePlan()
  const [tab, setTab] = useState('model')
  const [results, setResults] = useState([])
  const [season, setSeason] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetch('/api/results/fetch').then(r => r.json()).then(d => { setResults(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/stats').then(r => r.json()).then(d => setSeason(d.season || [])).catch(() => {})
  }, [])

  const pastResults = results.filter(r => r.pick_date < today)
  const byDate = pastResults.reduce((acc, r) => { const d = r.pick_date; if (!acc[d]) acc[d] = []; acc[d].push(r); return acc }, {})
  const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a))
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0]

  const totalSels = pastResults.length
  const winners = pastResults.filter(r => r.outcome === 'win').length
  const placed = pastResults.filter(r => r.outcome === 'win' || r.outcome === 'placed').length
  const accuracy = totalSels > 0 ? Math.round((winners / totalSels) * 100) : 0

  const outcomeColour = (o) => o === 'win' ? '#22c55e' : o === 'loss' ? '#ef4444' : o === 'void' ? '#f59e0b' : '#6b7280'
  const outcomeLabel = (o) => o === 'win' ? 'WIN' : o === 'loss' ? 'LOSS' : o === 'void' ? 'N/R' : 'PENDING'
  const plColour = (pl) => pl > 0 ? '#22c55e' : pl < 0 ? '#ef4444' : '#9ca3af'

  const PERSONA_COLOUR = { gordon: '#0F6E56', stan: '#185FA5', pez: '#993C1D' }
  const PERSONA_NAME = { gordon: 'Gaffer Gordon', stan: 'Stats Stan', pez: 'Punter Pez' }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Results</h1>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[['Selections', totalSels], ['Winners', winners], ['Win Rate', accuracy + '%']].map(([label, val]) => (
          <div key={label} style={{ flex: '1 1 100px', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{val}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[['model', 'Model Results'], ['tipsters', 'Tipster Competition']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 18px', background: tab === id ? '#0F6E56' : '#1c1c28', color: '#fff', border: '1px solid ' + (tab === id ? '#0F6E56' : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>{label}</button>
        ))}
      </div>

      {tab === 'model' && (
        plan === 'free' ? <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate> : (
          loading ? <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>Loading...</div> :
          dates.length === 0 ? <div style={{ color: '#6b7280', padding: '40px 0', textAlign: 'center' }}>No results yet. Check back after the first settled picks.</div> : (
            dates.map(date => (
              <div key={date} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: date === yesterday ? '#f0c040' : '#9ca3af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {date}{date === yesterday && <span style={{ fontSize: '10px', background: '#f0c04020', color: '#f0c040', padding: '2px 8px', borderRadius: '10px' }}>YESTERDAY</span>}
                </div>
                {byDate[date].map(r => (
                  <div key={r.pick_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#13131a', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid ' + (PERSONA_COLOUR[r.persona] || '#2a2a3a') }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.selection}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        <span style={{ color: PERSONA_COLOUR[r.persona] }}>{PERSONA_NAME[r.persona]}</span> — {r.market} — {r.odds_fractional}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: outcomeColour(r.outcome) }}>{outcomeLabel(r.outcome)}</div>
                      <div style={{ fontSize: '11px', color: plColour(r.profit_loss), marginTop: '2px' }}>{r.profit_loss >= 0 ? '+' : ''}£{Number(r.profit_loss || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )
        )
      )}

      {tab === 'tipsters' && (
        plan === 'free' ? <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate> : (
          <div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {season.map(s => {
                const pl = Number(s.profit_loss || 0)
                const wr = s.total_picks > 0 ? Math.round((s.wins / s.total_picks) * 100) : 0
                const colour = PERSONA_COLOUR[s.persona] || '#6b7280'
                return (
                  <div key={s.persona} style={{ flex: '1 1 200px', background: '#13131a', border: '1px solid ' + colour + '40', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ color: colour, fontWeight: 700, marginBottom: '10px' }}>{PERSONA_NAME[s.persona]}</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div><div style={{ fontSize: '18px', fontWeight: 800 }}>{wr}%</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Win Rate</div></div>
                      <div><div style={{ fontSize: '18px', fontWeight: 800 }}>{s.wins}/{s.total_picks}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>W/Total</div></div>
                      <div><div style={{ fontSize: '18px', fontWeight: 800, color: plColour(pl) }}>{pl >= 0 ? '+' : ''}£{Math.abs(pl).toFixed(2)}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>P+L</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      )}

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        Past performance is not a guarantee of future results. 18+ only.<br />
        <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133
      </div>
    </div>
  )
}