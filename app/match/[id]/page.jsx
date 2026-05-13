'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { usePlan } from '@/lib/usePlan'

const GBP = String.fromCharCode(163)
const PERSONA_META = {
  gordon: { name: 'Gaffer Gordon', colour: '#00C896' },
  stan:   { name: 'Stats Stan',    colour: '#185FA5' },
  pez:    { name: 'Punter Pez',    colour: '#993C1D' }
}

function decToFrac(dec) {
  if (!dec || dec <= 1) return 'N/A'
  const n = dec - 1
  if (n < 0.4) return '1/3'; if (n < 0.55) return '4/7'; if (n < 0.7) return '4/6'
  if (n < 0.85) return '5/6'; if (n < 1.05) return 'Evs'; if (n < 1.2) return '11/10'
  if (n < 1.4) return '6/5'; if (n < 1.6) return '6/4'; if (n < 1.85) return '7/4'
  if (n < 2.1) return '2/1'; if (n < 2.4) return '9/4'; if (n < 2.7) return '5/2'
  if (n < 3.1) return '3/1'; if (n < 3.6) return '7/2'; if (n < 4.1) return '4/1'
  return Math.round(n) + '/1'
}

const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']
const STATE_LABELS = { 1: 'Fixture Published', 2: 'Injuries Updated', 3: 'Projected Lineup', 4: 'Confirmed Lineup', 5: 'Live', 6: 'Full Time' }

function FactorBar({ label, value, max = 5 }) {
  const pct = Math.min(100, (value / max) * 100)
  const col = pct >= 70 ? '#00C896' : pct >= 40 ? '#F0B90B' : '#ef4444'
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
        <span style={{ color: '#8B949E', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
        <span style={{ fontWeight: 700, color: col }}>{value?.toFixed(1)}</span>
      </div>
      <div style={{ background: '#2A3441', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: col, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function PitchView({ homeTeam, awayTeam, homeScore, awayScore, formationHome, formationAway, homeLineup, awayLineup }) {
  const homeGoals = homeLineup.filter(p => ['Attacker','Forward'].includes(p.position))
  const homeMids  = homeLineup.filter(p => ['Midfielder'].includes(p.position))
  const homeDefs  = homeLineup.filter(p => ['Defender','Defender (Right)','Defender (Left)'].includes(p.position))
  const homeGK    = homeLineup.filter(p => p.position === 'Goalkeeper')
  const awayGoals = awayLineup.filter(p => ['Attacker','Forward'].includes(p.position))
  const awayMids  = awayLineup.filter(p => ['Midfielder'].includes(p.position))
  const awayDefs  = awayLineup.filter(p => ['Defender','Defender (Right)','Defender (Left)'].includes(p.position))
  const awayGK    = awayLineup.filter(p => p.position === 'Goalkeeper')

  function PlayerRow({ players, colour }) {
    if (!players.length) return null
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {players.map((p, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colour, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3px', fontSize: '11px', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}>
              {(p.player?.name || p.name || '?').split(' ').pop().substring(0, 3).toUpperCase()}
            </div>
            <div style={{ fontSize: '9px', color: '#8B949E', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(p.player?.name || p.name || '').split(' ').pop()}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: '#1a3a1a', borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden', marginBottom: '20px' }}>
      {/* Pitch markings */}
      <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '1px', background: 'rgba(255,255,255,0.15)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', transform: 'translate(-50%, -50%)' }} />

      {/* Score header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff', flex: 1 }}>{homeTeam}</div>
        <div style={{ textAlign: 'center', padding: '4px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px' }}>
          {homeScore !== null && awayScore !== null
            ? <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{homeScore} - {awayScore}</span>
            : <span style={{ fontSize: '13px', color: '#8B949E' }}>vs</span>
          }
          {formationHome && formationAway && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{formationHome} / {formationAway}</div>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff', flex: 1, textAlign: 'right' }}>{awayTeam}</div>
      </div>

      {/* Home team - top half */}
      {homeLineup.length > 0 ? (
        <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <PlayerRow players={homeGK}    colour='#185FA5' />
          <PlayerRow players={homeDefs}  colour='#185FA5' />
          <PlayerRow players={homeMids}  colour='#185FA5' />
          <PlayerRow players={homeGoals} colour='#185FA5' />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '16px' }}>Lineup TBC</div>
      )}

      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', margin: '8px 0' }} />

      {/* Away team - bottom half */}
      {awayLineup.length > 0 ? (
        <div style={{ marginTop: '16px', position: 'relative', zIndex: 1 }}>
          <PlayerRow players={awayGoals} colour='#993C1D' />
          <PlayerRow players={awayMids}  colour='#993C1D' />
          <PlayerRow players={awayDefs}  colour='#993C1D' />
          <PlayerRow players={awayGK}    colour='#993C1D' />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '16px' }}>Lineup TBC</div>
      )}
    </div>
  )
}

function OddsCard({ label, odds, signal, colour }) {
  return (
    <div style={{ flex: 1, background: signal ? colour + '15' : '#ffffff', border: '1px solid ' + (signal ? colour + '60' : '#e0e0e0'), borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', lineHeight: '1.3', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 900, color: signal ? colour : '#111' }}>{odds}</div>
      {signal && <div style={{ fontSize: '9px', color: colour, fontWeight: 800, marginTop: '2px' }}>ENGINE PICK</div>}
    </div>
  )
}

export default function MatchDetailPage() {
  const { id } = useParams()
  const { plan } = usePlan()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    if (!id) return
    fetch('/api/matches/' + id).then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message='Loading match...' />
  if (!data?.match) return <div style={{ padding: '40px', textAlign: 'center', color: '#484F58' }}>Match not found.</div>

  const { match, latest_score: score, odds, factors, weights, excitement, events, picks,
          home_lineup, away_lineup, home_sidelined, away_sidelined,
          formation_home, formation_away, preview_prediction, scores } = data

  const h = score?.total_home || 0
  const a = score?.total_away || 0
  const gap = Math.abs(h - a)
  const fav = h >= a ? match.home_team : match.away_team
  const isFinished = match.status === 'FT'
  const isLive = match.status === 'live'

  const homeWinOdds = decToFrac(odds?.match_winner?.home)
  const drawOdds    = decToFrac(odds?.match_winner?.draw)
  const awayWinOdds = decToFrac(odds?.match_winner?.away)
  const overOdds    = decToFrac(odds?.over_under?.over)
  const underOdds   = decToFrac(odds?.over_under?.under)
  const handicapOdds = odds?.handicap

  const scoreColour = (v) => v >= 70 ? '#00C896' : v >= 55 ? '#F0B90B' : '#8B949E'

  const sectionBtn = (key, label) => (
    <button key={key} onClick={() => setActiveSection(key)} style={{ padding: '8px 16px', background: activeSection === key ? '#00C896' : '#161B22', color: activeSection === key ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activeSection === key ? '#00C896' : '#2A3441'), borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
      {label}
    </button>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Link href='/dashboard' style={{ fontSize: '13px', color: '#484F58', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
        Back to Today
      </Link>

      {/* Match header */}
      <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#484F58', fontWeight: 600 }}>{match.league}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isLive && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', animation: 'pulse 1s infinite' }}>LIVE</span>}
            {isFinished && <span style={{ background: '#2A3441', color: '#8B949E', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>FT</span>}
            {!isLive && !isFinished && <span style={{ background: '#00C89620', color: '#00C896', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>{STATE_LABELS[score?.score_state] || 'Upcoming'}</span>}
            {excitement && <span style={{ background: '#F0B90B20', color: '#F0B90B', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>Excitement {excitement.toFixed(1)}/10</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{match.home_team}</div>
            {h > 0 && <div style={{ fontSize: '28px', fontWeight: 900, color: scoreColour(h), marginTop: '4px' }}>{Math.round(h)}</div>}
            <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Engine score</div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {isFinished || isLive
              ? <div style={{ fontSize: '36px', fontWeight: 900 }}>{match.home_score} - {match.away_score}</div>
              : <div style={{ fontSize: '20px', color: '#484F58', fontWeight: 700 }}>vs</div>
            }
            <div style={{ fontSize: '12px', color: '#484F58', marginTop: '4px' }}>
              {new Date(match.kickoff_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' '}{new Date(match.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {gap >= 10 && !isFinished && (
              <div style={{ marginTop: '6px', fontSize: '11px', background: '#00C89620', color: '#00C896', padding: '3px 10px', borderRadius: '10px', fontWeight: 700 }}>
                {fav} favoured
              </div>
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{match.away_team}</div>
            {a > 0 && <div style={{ fontSize: '28px', fontWeight: 900, color: scoreColour(a), marginTop: '4px' }}>{Math.round(a)}</div>}
            <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Engine score</div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {sectionBtn('overview', 'Overview')}
        {sectionBtn('pitch', 'Lineup & Pitch')}
        {sectionBtn('markets', 'Bet Markets')}
        {sectionBtn('engine', 'Engine Analysis')}
        {picks.length > 0 && sectionBtn('tips', 'Tipster Picks')}
        {events.length > 0 && sectionBtn('events', 'Match Events')}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div>
          {/* Pitch view teaser */}
          <PitchView
            homeTeam={match.home_team} awayTeam={match.away_team}
            homeScore={match.home_score} awayScore={match.away_score}
            formationHome={formation_home} formationAway={formation_away}
            homeLineup={home_lineup} awayLineup={away_lineup}
          />

          {/* Quick odds */}
          {odds?.match_winner && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>MATCH RESULT</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={match.home_team + ' Win'} odds={homeWinOdds} signal={h > a + 15} colour='#00C896' />
                <OddsCard label='Draw' odds={drawOdds} signal={gap < 5} colour='#F0B90B' />
                <OddsCard label={match.away_team + ' Win'} odds={awayWinOdds} signal={a > h + 15} colour='#00C896' />
              </div>
            </div>
          )}

          {/* Sidelined */}
          {(home_sidelined.length > 0 || away_sidelined.length > 0) && (
            <div style={{ background: '#161B22', border: '1px solid #ef444440', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '1px', marginBottom: '10px' }}>SIDELINED / INJURIES</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {home_sidelined.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.home_team}</div>
                    {home_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '3px' }}>{p.player?.name || p.name || p}</div>)}
                  </div>
                )}
                {away_sidelined.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.away_team}</div>
                    {away_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '3px' }}>{p.player?.name || p.name || p}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookmakers */}
          <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>BET WITH</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BOOKMAKERS.map(bm => (
                <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
          </div>
        </div>
      )}

      {/* PITCH */}
      {activeSection === 'pitch' && (
        <div>
          <PitchView
            homeTeam={match.home_team} awayTeam={match.away_team}
            homeScore={match.home_score} awayScore={match.away_score}
            formationHome={formation_home} formationAway={formation_away}
            homeLineup={home_lineup} awayLineup={away_lineup}
          />
          {home_sidelined.length > 0 || away_sidelined.length > 0 ? (
            <div style={{ background: '#161B22', border: '1px solid #ef444440', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '1px', marginBottom: '10px' }}>UNAVAILABLE PLAYERS</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {home_sidelined.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.home_team}</div>
                    {home_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>{p.player?.name || p.name || p}</div>)}
                  </div>
                )}
                {away_sidelined.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.away_team}</div>
                    {away_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>{p.player?.name || p.name || p}</div>)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#484F58', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No injury/suspension data available.</div>
          )}
        </div>
      )}

      {/* MARKETS */}
      {activeSection === 'markets' && (
        <div>
          {/* Match Result */}
          {odds?.match_winner && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>MATCH RESULT</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={match.home_team + ' Win'} odds={homeWinOdds} signal={h > a + 15} colour='#00C896' />
                <OddsCard label='Draw' odds={drawOdds} signal={gap < 5} colour='#F0B90B' />
                <OddsCard label={match.away_team + ' Win'} odds={awayWinOdds} signal={a > h + 15} colour='#00C896' />
              </div>
            </div>
          )}
          {/* Over/Under */}
          {odds?.over_under && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>GOALS MARKET</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={'Over ' + (odds.over_under.total || 2.5) + ' Goals'} odds={overOdds} signal={h + a > 105} colour='#185FA5' />
                <OddsCard label={'Under ' + (odds.over_under.total || 2.5) + ' Goals'} odds={underOdds} signal={h + a < 95} colour='#185FA5' />
              </div>
            </div>
          )}
          {/* Handicap */}
          {odds?.handicap && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>ASIAN HANDICAP ({odds.handicap.market})</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={match.home_team + ' ' + (odds.handicap.market > 0 ? '+' : '') + odds.handicap.market} odds={decToFrac(odds.handicap.home)} signal={false} colour='#00C896' />
                <OddsCard label={match.away_team + ' ' + (odds.handicap.market > 0 ? '-' : '+') + Math.abs(odds.handicap.market)} odds={decToFrac(odds.handicap.away)} signal={false} colour='#00C896' />
              </div>
            </div>
          )}
          {/* Markets we track but need more data for */}
          <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '12px' }}>ADDITIONAL MARKETS</div>
            {[
              { label: 'Both Teams To Score', note: 'BTTS Yes / No - odds via bookmaker links' },
              { label: 'Correct Score', note: 'Phase 2 - Poisson model in development' },
              { label: 'Anytime Goalscorer', note: 'Available once confirmed lineup loaded' },
              { label: 'First Goalscorer', note: 'Available once confirmed lineup loaded' },
              { label: 'Player Cards', note: 'Phase 2 - referee profile model' },
              { label: 'Corners', note: 'Phase 2 - requires in-play data feed' }
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2530', fontSize: '13px' }}>
                <span style={{ color: '#8B949E', fontWeight: 600 }}>{m.label}</span>
                <span style={{ color: '#484F58', fontSize: '12px' }}>{m.note}</span>
              </div>
            ))}
          </div>
          {/* Bookmakers */}
          <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>BET WITH</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BOOKMAKERS.map(bm => (
                <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ENGINE ANALYSIS */}
      {activeSection === 'engine' && (
        <div>
          {/* Score state journey */}
          {scores.length > 0 && (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '14px' }}>SCORE JOURNEY</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {scores.map(s => (
                  <div key={s.score_state} style={{ flex: '1 1 100px', background: s.score_state === score?.score_state ? '#00C89620' : '#1E2530', border: '1px solid ' + (s.score_state === score?.score_state ? '#00C89640' : '#2A3441'), borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#484F58', marginBottom: '4px' }}>State {s.score_state}</div>
                    <div style={{ fontSize: '11px', color: '#8B949E', marginBottom: '6px' }}>{STATE_LABELS[s.score_state]}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#00C896' }}>{Math.round(s.total_home)}</div>
                    <div style={{ fontSize: '11px', color: '#484F58' }}>vs</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8B949E' }}>{Math.round(s.total_away)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Factor breakdown */}
          {factors && (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '14px' }}>FACTOR SCORES</div>
              {Object.entries(factors).map(([key, val]) => (
                <FactorBar key={key} label={key} value={val} max={5} />
              ))}
            </div>
          )}
          {/* Weight breakdown */}
          {weights && (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '14px' }}>ENGINE WEIGHTS USED</div>
              {Object.entries(weights).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E2530', fontSize: '13px' }}>
                  <span style={{ color: '#8B949E', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 700, color: '#E6EDF3' }}>{(val * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
          {/* Preview prediction */}
          {preview_prediction && (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '10px' }}>AI PREVIEW PREDICTION</div>
              <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                {preview_prediction.type?.replace(/_/g, ' ')} - {preview_prediction.choice} {preview_prediction.total || ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TIPSTER PICKS */}
      {activeSection === 'tips' && picks.length > 0 && (
        <div>
          {picks.map((pick, i) => {
            const meta = PERSONA_META[pick.persona] || { name: pick.persona, colour: '#8B949E' }
            const outcome = pick.outcome
            const outcomeCol = outcome === 'win' ? '#00C896' : outcome === 'loss' ? '#ef4444' : outcome === 'void' ? '#F0B90B' : '#484F58'
            return (
              <div key={i} style={{ background: '#ffffff', border: '2px solid ' + meta.colour, borderRadius: '10px', padding: '16px', marginBottom: '12px', color: '#111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, color: meta.colour }}>{meta.name}</div>
                  {outcome && <div style={{ background: outcomeCol, color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '10px' }}>{outcome.toUpperCase()}</div>}
                  {pick.is_best_pick && <span style={{ background: '#F0B90B', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>BEST PICK</span>}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                  {pick.selection} <span style={{ color: meta.colour }}>@ {pick.odds_fractional}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Stake: {GBP}{pick.stake}</div>
                {pick.tip_text && (
                  <div style={{ fontSize: '13px', color: '#444', fontStyle: 'italic', paddingLeft: '10px', borderLeft: '3px solid ' + meta.colour }}>{pick.tip_text}</div>
                )}
                {outcome && pick.profit_loss !== 0 && (
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 800, color: outcomeCol }}>
                    {Number(pick.profit_loss) > 0 ? '+' : ''}{GBP}{Math.abs(Number(pick.profit_loss)).toFixed(2)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MATCH EVENTS */}
      {activeSection === 'events' && (
        <div>
          {events.length === 0 ? (
            <div style={{ color: '#484F58', textAlign: 'center', padding: '40px', fontSize: '14px' }}>No events recorded yet.</div>
          ) : (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px' }}>
              {events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ev.event_type === 'goal' ? '#00C896' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                    {ev.event_type === 'goal' ? 'G' : ev.event_type === 'penalty' ? 'P' : 'R'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{ev.player_name}</div>
                    <div style={{ fontSize: '12px', color: '#484F58' }}>{ev.minute ? ev.minute + 'min' : ''} - {ev.event_type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '32px', fontSize: '11px', color: '#484F58', textAlign: 'center' }}>
        18+ only. Gamble responsibly. BeGambleAware.org | 0808 8020 133
      </div>
    </div>
  )
}