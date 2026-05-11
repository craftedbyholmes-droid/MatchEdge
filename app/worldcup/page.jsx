'use client'
import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

const GBP = String.fromCharCode(163)
const CONF_COLOURS = {
  UEFA: '#003399', CONMEBOL: '#006847', CONCACAF: '#BF0A30',
  CAF: '#009A44', AFC: '#DA0000', OFC: '#00843D'
}

// Engine-based group winner prediction
function predictWinner(groupTeams, groupMatches) {
  if (!groupMatches.some(m => m.score)) return null
  // Sum engine scores across all matches for each team
  const teamScores = {}
  for (const match of groupMatches) {
    if (!match.score) continue
    const h = match.home_team_id
    const a = match.away_team_id
    if (!teamScores[h]) teamScores[h] = 0
    if (!teamScores[a]) teamScores[a] = 0
    teamScores[h] += match.score.total_home || 0
    teamScores[a] += match.score.total_away || 0
  }
  const sorted = Object.entries(teamScores).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || null
}

function formatKO(kt) {
  if (!kt) return ''
  const d = new Date(kt)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' BST'
}

function ScoreBadge({ score, isHome }) {
  if (!score) return null
  const val = Math.round(isHome ? score.total_home : score.total_away)
  const col = val >= 70 ? '#00C896' : val >= 55 ? '#F0B90B' : '#8B949E'
  return <span style={{ fontSize: '12px', fontWeight: 700, color: col, marginLeft: '6px' }}>({val})</span>
}

export default function WorldCupPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('A')

  useEffect(() => {
    fetch('/api/worldcup/data').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const daysUntil = Math.ceil((new Date('2026-06-11T21:00:00Z') - new Date()) / 86400000)

  const groups = data?.groups || []
  const allTeams = data?.teams || []
  const allMatches = data?.matches || []

  function getGroupTeams(gId) {
    return allTeams
      .filter(t => t.group_id === gId)
      .sort((a, b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against) || b.goals_for - a.goals_for)
  }

  function getGroupMatches(gId) {
    return allMatches.filter(m => m.group_id === gId)
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a2463 0%, #1b4332 100%)', borderRadius: '12px', padding: '32px 24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0B90B', letterSpacing: '3px', marginBottom: '8px' }}>FIFA</div>
        <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>World Cup 2026</div>
        <div style={{ fontSize: '14px', color: '#8B949E', marginBottom: '20px' }}>USA - Canada - Mexico - 11 June to 19 July 2026</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['48 Teams',''], ['12 Groups',''], ['104 Matches',''], ['3 Host Nations','']].map(([v]) => (
            <div key={v} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{v}</div>
          ))}
        </div>
      </div>

      {/* Countdown */}
      <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '52px', fontWeight: 900, color: '#F0B90B', lineHeight: 1 }}>{daysUntil}</div>
        <div style={{ fontSize: '14px', color: '#8B949E', marginTop: '6px' }}>days until kickoff - Mexico vs South Africa opens the tournament</div>
      </div>

      {loading ? <LoadingSpinner message='Loading groups and fixtures...' /> : (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Group Stage</h2>

          {/* Group tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {groups.map(g => (
              <button key={g.group_id} onClick={() => setActiveGroup(g.group_id)} style={{ padding: '6px 14px', background: activeGroup === g.group_id ? '#00C896' : '#161B22', color: activeGroup === g.group_id ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activeGroup === g.group_id ? '#00C896' : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                {g.group_id}
              </button>
            ))}
          </div>

          {/* Active group */}
          {(() => {
            const gTeams = getGroupTeams(activeGroup)
            const gMatches = getGroupMatches(activeGroup)
            const predicted = predictWinner(gTeams, gMatches)
            const hasScores = gMatches.some(m => m.score)
            return (
              <div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {/* Standings table */}
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#1E2530', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>Group {activeGroup}</div>
                        {hasScores && predicted && (
                          <div style={{ fontSize: '11px', color: '#F0B90B', fontWeight: 700 }}>ENGINE PREDICTS: {gTeams.find(t => t.team_id === predicted)?.name || predicted}</div>
                        )}
                      </div>
                      <div style={{ padding: '0 8px 8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 32px 32px 32px 48px 48px', gap: '0', padding: '8px 8px 4px', fontSize: '10px', color: '#484F58', fontWeight: 700, letterSpacing: '0.5px' }}>
                          <div>TEAM</div><div style={{ textAlign: 'center' }}>P</div><div style={{ textAlign: 'center' }}>W</div><div style={{ textAlign: 'center' }}>D</div><div style={{ textAlign: 'center' }}>L</div><div style={{ textAlign: 'center' }}>GD</div><div style={{ textAlign: 'center' }}>PTS</div>
                        </div>
                        {gTeams.map((team, idx) => {
                          const isWinner = team.team_id === predicted && hasScores
                          const gd = (team.goals_for || 0) - (team.goals_against || 0)
                          return (
                            <div key={team.team_id} style={{ display: 'grid', gridTemplateColumns: '1fr 32px 32px 32px 32px 48px 48px', gap: '0', padding: '8px', background: isWinner ? '#00C89610' : idx % 2 === 0 ? '#13181f' : 'transparent', borderRadius: '6px', border: isWinner ? '1px solid #00C89640' : '1px solid transparent', marginBottom: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isWinner && <span style={{ fontSize: '9px', background: '#00C896', color: '#0B0E11', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>PICK</span>}
                                {idx < 2 && !isWinner && <span style={{ width: '3px', height: '14px', background: '#00C896', borderRadius: '2px', flexShrink: 0, display: 'inline-block' }} />}
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{team.name}</div>
                                  <div style={{ fontSize: '10px', color: CONF_COLOURS[team.confederation] || '#484F58', fontWeight: 600 }}>{team.confederation}</div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', fontSize: '13px' }}>{team.played || 0}</div>
                              <div style={{ textAlign: 'center', fontSize: '13px' }}>{team.wins || 0}</div>
                              <div style={{ textAlign: 'center', fontSize: '13px' }}>{team.draws || 0}</div>
                              <div style={{ textAlign: 'center', fontSize: '13px' }}>{team.losses || 0}</div>
                              <div style={{ textAlign: 'center', fontSize: '13px', color: gd > 0 ? '#00C896' : gd < 0 ? '#ef4444' : '#8B949E' }}>{gd > 0 ? '+' : ''}{gd}</div>
                              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 800, color: (team.points || 0) > 0 ? '#E6EDF3' : '#484F58' }}>{team.points || 0}</div>
                            </div>
                          )
                        })}
                        <div style={{ fontSize: '11px', color: '#484F58', padding: '8px', borderTop: '1px solid #2A3441', marginTop: '4px' }}>
                          Top 2 qualify automatically. 8 best third-place teams also advance.
                          {!hasScores && <span style={{ color: '#F0B90B', marginLeft: '6px' }}>Engine picks available once scoring starts.</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fixtures */}
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#8B949E' }}>FIXTURES</div>
                    {gMatches.map(match => {
                      const isFinished = match.status === 'FT'
                      const hasScore = match.home_score !== null && isFinished
                      const pred = match.score
                      const favHome = pred && pred.total_home > pred.total_away
                      const favAway = pred && pred.total_away > pred.total_home
                      return (
                        <div key={match.match_id} style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderLeft: '3px solid ' + (isFinished ? '#2A3441' : '#00C896'), borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', color: '#111' }}>
                          {/* Teams + score */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                              <span style={{ fontWeight: favHome ? 800 : 600, fontSize: '14px' }}>{match.home_team}</span>
                              {pred && <ScoreBadge score={pred} isHome={true} />}
                            </div>
                            {hasScore ? (
                              <div style={{ fontSize: '18px', fontWeight: 900, padding: '0 12px', color: '#111' }}>{match.home_score} - {match.away_score}</div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#888', padding: '0 12px' }}>vs</div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                              {pred && <ScoreBadge score={pred} isHome={false} />}
                              <span style={{ fontWeight: favAway ? 800 : 600, fontSize: '14px' }}>{match.away_team}</span>
                            </div>
                          </div>
                          {/* Date + venue */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                            <span>{formatKO(match.kickoff_time)}</span>
                            <span>{match.venue || match.city}</span>
                          </div>
                          {/* Engine prediction */}
                          {pred && !isFinished && (
                            <div style={{ marginTop: '6px', fontSize: '11px', background: '#f0faf6', border: '1px solid #00C89640', borderRadius: '4px', padding: '4px 8px', color: '#007a5e', fontWeight: 600 }}>
                              Engine: {favHome ? match.home_team : match.away_team} favoured ({Math.round(Math.abs((pred.total_home||0) - (pred.total_away||0)))}pt gap)
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* All groups overview grid */}
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', marginTop: '8px' }}>All Groups Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {groups.map(g => {
              const gTeams = getGroupTeams(g.group_id)
              const gMatches = getGroupMatches(g.group_id)
              const predicted = predictWinner(gTeams, gMatches)
              return (
                <div key={g.group_id} onClick={() => setActiveGroup(g.group_id)} style={{ background: '#161B22', border: '1px solid ' + (activeGroup === g.group_id ? '#00C896' : '#2A3441'), borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '10px', color: activeGroup === g.group_id ? '#00C896' : '#E6EDF3' }}>Group {g.group_id}</div>
                  {gTeams.map(team => (
                    <div key={team.team_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1E2530' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {team.team_id === predicted && <span style={{ width: '6px', height: '6px', background: '#00C896', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />}
                        {team.team_id !== predicted && <span style={{ width: '6px', height: '6px', background: 'transparent', display: 'inline-block', flexShrink: 0 }} />}
                        <span style={{ fontSize: '13px', fontWeight: team.team_id === predicted ? 700 : 400, color: team.team_id === predicted ? '#E6EDF3' : '#8B949E' }}>{team.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: (team.points||0) > 0 ? '#E6EDF3' : '#484F58' }}>{team.points || 0}pts</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#484F58', textAlign: 'center', lineHeight: '1.8' }}>
        Engine scores generate as fixtures are scored closer to kick-off.<br />
        18+ only. Gamble responsibly. BeGambleAware.org
      </div>
    </div>
  )
}