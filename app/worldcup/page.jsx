'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import Link from 'next/link'

const CONF_COLOURS = {
  'UEFA': '#003399', 'CONMEBOL': '#006400', 'CONCACAF': '#8B0000',
  'CAF': '#8B6914', 'AFC': '#006494', 'OFC': '#2d6a4f'
}

const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function WorldCupPage() {
  const { plan } = usePlan()
  const [groups, setGroups] = useState([])
  const [matches, setMatches] = useState([])
  const [picks, setPicks] = useState([])
  const [activeStage, setActiveStage] = useState('group')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/worldcup/groups').then(r => r.json()),
      fetch('/api/worldcup/matches').then(r => r.json()),
      fetch('/api/worldcup/picks').then(r => r.json())
    ]).then(([g, m, p]) => {
      setGroups(Array.isArray(g) ? g : [])
      setMatches(Array.isArray(m) ? m : [])
      setPicks(Array.isArray(p) ? p : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stages = [...new Set(matches.map(m => m.stage))].sort()
  const filteredMatches = matches.filter(m => m.stage === activeStage || activeStage === 'all')

  function formatKickoff(kt) {
    if (!kt) return 'TBC'
    return new Date(kt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const PERSONA_COLOUR = { gordon: '#0F6E56', stan: '#185FA5', pez: '#993C1D' }
  const PERSONA_NAME = { gordon: 'Gaffer Gordon', stan: 'Stats Stan', pez: 'Punter Pez' }

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a2463 0%, #1b4332 100%)', borderRadius: '10px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0c040', letterSpacing: '2px', marginBottom: '8px' }}>FIFA</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>World Cup 2026</h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>USA · Canada · Mexico · 11 June — 19 July 2026</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px' }}>48 Teams</div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px' }}>12 Groups</div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px' }}>104 Matches</div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px' }}>3 Host Nations</div>
        </div>
      </div>

      {/* Countdown */}
      <CountdownBanner />

      {/* Tipster picks - paid only */}
      {picks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Tipster Picks</h2>
          {plan === 'free' ? (
            <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px' }}>Upgrade to see World Cup tipster selections</div>
              <a href='/pricing' style={{ background: '#f0c040', color: '#0a0a0f', padding: '8px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '13px' }}>Try Today £1.99</a>
            </div>
          ) : (
            picks.map(pick => (
              <div key={pick.pick_id} style={{ background: '#13131a', border: '1px solid ' + (PERSONA_COLOUR[pick.persona] || '#2a2a3a') + '30', borderRadius: '8px', padding: '14px 16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: PERSONA_COLOUR[pick.persona], fontWeight: 700, fontSize: '13px' }}>{PERSONA_NAME[pick.persona]}</span>
                  {pick.is_best_pick && <span style={{ fontSize: '10px', background: '#f0c04020', color: '#f0c040', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>BEST PICK</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{pick.selection} <span style={{ color: '#9ca3af', fontWeight: 400 }}>@ {pick.odds_fractional}</span></div>
                {pick.tip_text && <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>{pick.tip_text}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Group tables */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Group Stage</h2>
      {loading ? (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>Loading...</div>
      ) : groups.length === 0 ? (
        <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Group stage data will populate as the tournament approaches.</div>
          <div style={{ fontSize: '13px', color: '#4b5563' }}>Tournament starts 11 June 2026. Check back closer to the event.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {groups.map(group => (
            <div key={group.group_id} style={{ flex: '1 1 300px', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#1c1c28', padding: '10px 14px', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #2a2a3a' }}>
                {group.group_name}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #2a2a3a' }}>
                    <th style={{ padding: '6px 14px', textAlign: 'left', fontWeight: 500 }}>Team</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>P</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>W</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>D</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>L</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>GD</th>
                    <th style={{ padding: '6px 14px', textAlign: 'center', fontWeight: 700 }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {(group.teams || []).sort((a,b) => b.points - a.points || (b.goals_for-b.goals_against) - (a.goals_for-a.goals_against)).map((team, i) => (
                    <tr key={team.team_id} style={{ borderBottom: '1px solid #1c1c28', background: i < 2 ? '#0F6E5610' : 'transparent' }}>
                      <td style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {i < 2 && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0F6E56', flexShrink: 0, display: 'inline-block' }} />}
                        <span style={{ fontWeight: i < 2 ? 600 : 400 }}>{team.name}</span>
                        <span style={{ fontSize: '10px', color: CONF_COLOURS[team.confederation] || '#6b7280', background: (CONF_COLOURS[team.confederation] || '#6b7280') + '20', padding: '1px 5px', borderRadius: '8px' }}>{team.confederation}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9ca3af' }}>{team.played}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9ca3af' }}>{team.wins}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9ca3af' }}>{team.draws}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9ca3af' }}>{team.losses}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#9ca3af' }}>{(team.goals_for - team.goals_against) >= 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 800, color: '#e8e8f0' }}>{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Fixtures</h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {['all', ...stages].map(s => (
              <button key={s} onClick={() => setActiveStage(s)} style={{ padding: '5px 12px', background: activeStage === s ? '#0F6E56' : '#1c1c28', color: '#fff', border: '1px solid ' + (activeStage === s ? '#0F6E56' : '#2a2a3a'), borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                {s === 'all' ? 'All Stages' : s}
              </button>
            ))}
          </div>
          {filteredMatches.map(match => (
            <div key={match.match_id} style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.home_team || 'TBD'}</span>
                    <span style={{ color: '#6b7280' }}>vs</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{match.away_team || 'TBD'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {match.stage}{match.group_id ? ' — Group ' + match.group_id : ''} · {match.venue || match.city || ''} · {formatKickoff(match.kickoff_time)}
                  </div>
                </div>
                {match.status === 'FT' ? (
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>{match.home_score} — {match.away_score}</div>
                ) : match.home_score != null ? (
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#22c55e' }}>{match.home_score} — {match.away_score}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}

function CountdownBanner() {
  const [days, setDays] = useState(0)
  useEffect(() => {
    const wc = new Date('2026-06-11T20:00:00Z')
    const diff = wc - new Date()
    setDays(Math.max(0, Math.floor(diff / 86400000)))
  }, [])
  return (
    <div style={{ background: '#13131a', border: '1px solid #f0c04040', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', fontWeight: 900, color: '#f0c040' }}>{days}</div>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>days until kickoff — Mexico vs host nation opens the tournament</div>
    </div>
  )
}