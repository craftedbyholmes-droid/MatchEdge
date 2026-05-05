'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'
import Link from 'next/link'

export default function MatchPage({ params }) {
  const { id } = params
  const { plan } = usePlan()
  const [match, setMatch] = useState(null)
  const [score, setScore] = useState(null)
  const [impacts, setImpacts] = useState([])
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch('/api/matches/' + id).then(r => r.json()),
      fetch('/api/personas/picks?fixture=' + id).then(r => r.json())
    ]).then(([matchData, pickData]) => {
      setMatch(matchData?.match || null)
      setScore(matchData?.score || null)
      setImpacts(matchData?.impacts || [])
      setPicks(Array.isArray(pickData) ? pickData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '40px 0', color: '#6b7280', textAlign: 'center' }}>Loading match...</div>
  if (!match) return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ color: '#ef4444', marginBottom: '12px' }}>Match not found.</div>
      <Link href='/dashboard' style={{ color: '#0F6E56', fontSize: '14px' }}>Back to Today</Link>
    </div>
  )

  const homeScore = score?.total_home || 0
  const awayScore = score?.total_away || 0
  const isHighConf = Math.max(homeScore, awayScore) >= 75
  const flaggedImpacts = impacts.filter(i => i.flagged)
  const PERSONA_COLOUR = { gordon: '#0F6E56', stan: '#185FA5', pez: '#993C1D' }
  const PERSONA_NAME = { gordon: 'Gaffer Gordon', stan: 'Stats Stan', pez: 'Punter Pez' }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Link href='/dashboard' style={{ color: '#6b7280', fontSize: '13px' }}>Back to Today</Link>
      </div>
      <div style={{ background: '#13131a', border: '1px solid ' + (isHighConf ? '#f0c04040' : '#2a2a3a'), borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{match.league}</div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{match.home_team} vs {match.away_team}</h1>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>{match.kickoff_time ? new Date(match.kickoff_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBC'}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isHighConf && <span style={{ background: '#f0c04020', color: '#f0c040', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>HIGH CONFIDENCE</span>}
            <span style={{ fontSize: '11px', color: '#6b7280', background: '#1c1c28', padding: '4px 10px', borderRadius: '6px' }}>State {match.score_state || 1}/6</span>
          </div>
        </div>
      </div>
      {plan === 'free' ? <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate> : (
        <>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: '#13131a', border: '1px solid ' + (homeScore > awayScore ? '#22c55e40' : '#2a2a3a'), borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>HOME</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: homeScore > awayScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(homeScore)}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{match.home_team}</div>
            </div>
            <div style={{ flex: 1, background: '#13131a', border: '1px solid ' + (awayScore > homeScore ? '#22c55e40' : '#2a2a3a'), borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>AWAY</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: awayScore > homeScore ? '#22c55e' : '#e8e8f0' }}>{Math.round(awayScore)}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>{match.away_team}</div>
            </div>
          </div>
          {score && (
            <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Unit Breakdown</div>
              {[['Central Clash', score.central_clash],['Wide Battle', score.wide_battle],['Set Piece', score.set_piece],['Form Momentum', score.form_momentum]].filter(([,v]) => v != null).map(([label, val]) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{Math.round(val)}</span>
                  </div>
                  <div style={{ background: '#1c1c28', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: Math.min(val, 100) + '%', height: '100%', background: val >= 75 ? '#22c55e' : val >= 60 ? '#f0c040' : '#4d9fff', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Momentum:</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: score.momentum_direction === 'home' ? '#22c55e' : '#4d9fff' }}>{score.momentum_direction === 'home' ? match.home_team : match.away_team}</span>
              </div>
            </div>
          )}
          {plan === 'edge' && flaggedImpacts.length > 0 && (
            <div style={{ background: '#13131a', border: '1px solid #4d9fff40', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#4d9fff' }}>BENCH IMPACT</div>
              {flaggedImpacts.map((imp, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c1c28' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{imp.player_name || imp.player_id}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{imp.team} — {imp.likely_position}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: imp.delta > 0 ? '#22c55e' : '#ef4444' }}>{imp.delta > 0 ? '+' : ''}{imp.delta} pts</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{imp.unit_score_before} to {imp.unit_score_after}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {picks.length > 0 && (
            <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Tipster Picks</div>
              {picks.map(pick => (
                <div key={pick.pick_id} style={{ padding: '10px 0', borderBottom: '1px solid #1c1c28' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: PERSONA_COLOUR[pick.persona] }}>{PERSONA_NAME[pick.persona]}</span>
                    {pick.is_best_pick && <span style={{ fontSize: '10px', background: '#f0c04020', color: '#f0c040', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>BEST PICK</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{pick.selection} <span style={{ color: '#9ca3af', fontWeight: 400 }}>@ {pick.odds_fractional}</span></div>
                  {pick.tip_text && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>{pick.tip_text}</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Bookmakers</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'].map(name => (
                <a key={name} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#1c1c28', border: '1px solid #2a2a3a', color: '#9ca3af', padding: '6px 14px', borderRadius: '4px', fontSize: '13px' }}>{name}</a>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#4b5563' }}>18+ | Please gamble responsibly | BeGambleAware.org</div>
          </div>
        </>
      )}
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        Tips are for information only. 18+ only.<br />
        <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133
      </div>
    </div>
  )
}