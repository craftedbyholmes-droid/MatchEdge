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
const BOOKMAKERS = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred']
const STATE_LABELS = { 1: 'Fixture Published', 2: 'Injuries Updated', 3: 'Projected Lineup', 4: 'Confirmed Lineup', 5: 'Live', 6: 'Full Time' }

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

function OddsCard({ label, odds, signal, colour }) {
  return (
    <div style={{ flex: 1, background: signal ? colour + '15' : '#ffffff', border: '1px solid ' + (signal ? colour + '60' : '#e0e0e0'), borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', lineHeight: '1.3', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 900, color: signal ? colour : '#111' }}>{odds}</div>
      {signal && <div style={{ fontSize: '9px', color: colour, fontWeight: 800, marginTop: '2px' }}>ENGINE PICK</div>}
    </div>
  )
}

function splitDefence(defenders) {
  if (!defenders.length) return { left: [], centre: [], right: [] }
  if (defenders.length === 1) return { left: [], centre: defenders, right: [] }
  if (defenders.length === 2) return { left: [defenders[0]], centre: [], right: [defenders[1]] }
  if (defenders.length === 3) return { left: [defenders[0]], centre: [defenders[1]], right: [defenders[2]] }
  if (defenders.length === 4) return { left: [defenders[0]], centre: [defenders[1], defenders[2]], right: [defenders[3]] }
  return { left: [defenders[0]], centre: defenders.slice(1, defenders.length - 1), right: [defenders[defenders.length - 1]] }
}

function splitAttack(attackers, midfielders) {
  const atts = attackers.length > 0 ? attackers : midfielders.slice(-2)
  if (!atts.length) return { left: [], centre: [], right: [] }
  if (atts.length === 1) return { left: [], centre: atts, right: [] }
  if (atts.length === 2) return { left: [atts[0]], centre: [], right: [atts[1]] }
  if (atts.length === 3) return { left: [atts[0]], centre: [atts[1]], right: [atts[2]] }
  return { left: [atts[0]], centre: atts.slice(1, atts.length - 1), right: [atts[atts.length - 1]] }
}

function groupLineup(lineup) {
  const pos = (p) => (p.position || '').toLowerCase()
  const gk  = lineup.filter(p => pos(p).includes('goalkeeper'))
  const def = lineup.filter(p => pos(p).includes('defender'))
  const mid = lineup.filter(p => pos(p).includes('midfielder'))
  const att = lineup.filter(p => ['attacker','forward','striker'].some(x => pos(p).includes(x)))
  return { gk, def, mid, att, defSplit: splitDefence(def), attSplit: splitAttack(att, mid) }
}

function chipName(p) {
  return (p.player?.name || p.name || '').split(' ').pop().substring(0, 8)
}

function PlayerChip({ p, colour }) {
  return (
    <span style={{ background: colour, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', display: 'inline-block', margin: '1px', whiteSpace: 'nowrap' }}>
      {chipName(p)}
    </span>
  )
}

function ZoneBlock({ players, colour, label, advantage }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: advantage ? colour + '22' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (advantage ? colour + '80' : 'rgba(255,255,255,0.08)'), borderRadius: '6px', padding: '6px 4px', textAlign: 'center' }}>
      <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', marginBottom: '3px', letterSpacing: '0.5px' }}>{label}</div>
      {players.length > 0
        ? <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {players.map((p, i) => <PlayerChip key={i} p={p} colour={advantage ? colour : '#444'} />)}
          </div>
        : <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>-</span>
      }
      {advantage && <div style={{ fontSize: '8px', color: colour, fontWeight: 800, marginTop: '3px' }}>EDGE</div>}
    </div>
  )
}

function PositionalClash({ label, homeZones, awayZones, homeColour, awayColour }) {
  const zones = ['left', 'centre', 'right']
  const zoneLabels = { left: 'Left', centre: 'Centre', right: 'Right' }
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: '4px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {zones.map(z => {
            const hPlayers = homeZones[z] || []
            const aPlayers = awayZones[z] || []
            return <ZoneBlock key={z} players={hPlayers} colour={homeColour} label={zoneLabels[z]} advantage={hPlayers.length > 0 && hPlayers.length > aPlayers.length} />
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.15)', paddingTop: '20px' }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {zones.map(z => {
            const hPlayers = homeZones[z] || []
            const aPlayers = awayZones[z] || []
            return <ZoneBlock key={z} players={aPlayers} colour={awayColour} label={zoneLabels[z]} advantage={aPlayers.length > hPlayers.length} />
          })}
        </div>
      </div>
    </div>
  )
}

function MidfieldRow({ homeMid, awayMid }) {
  const hAdv = homeMid.length > awayMid.length
  const aAdv = awayMid.length > homeMid.length
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Midfield Battle</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: '4px', alignItems: 'center' }}>
        <div style={{ background: hAdv ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (hAdv ? '#00C89660' : 'rgba(255,255,255,0.08)'), borderRadius: '6px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {homeMid.map((p, i) => <PlayerChip key={i} p={p} colour={hAdv ? '#00C896' : '#444'} />)}
          </div>
          {hAdv && <div style={{ fontSize: '8px', color: '#00C896', fontWeight: 800, marginTop: '3px' }}>EDGE</div>}
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>vs</div>
        <div style={{ background: aAdv ? 'rgba(153,60,29,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (aAdv ? '#993C1D60' : 'rgba(255,255,255,0.08)'), borderRadius: '6px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {awayMid.map((p, i) => <PlayerChip key={i} p={p} colour={aAdv ? '#993C1D' : '#444'} />)}
          </div>
          {aAdv && <div style={{ fontSize: '8px', color: '#993C1D', fontWeight: 800, marginTop: '3px' }}>EDGE</div>}
        </div>
      </div>
    </div>
  )
}

function PitchBlockView({ homeTeam, awayTeam, homeScore, awayScore, homeLineup, awayLineup, formationHome, formationAway }) {
  const h = homeScore || 0
  const a = awayScore || 0
  const gap = Math.abs(h - a)
  const home = groupLineup(homeLineup || [])
  const away = groupLineup(awayLineup || [])
  const hasLineups = (homeLineup || []).length > 0 || (awayLineup || []).length > 0

  return (
    <div style={{ background: 'linear-gradient(180deg, #0d2b0d 0%, #1a3a1a 50%, #0d2b0d 100%)', borderRadius: '12px', padding: '16px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '60px', height: '60px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'translate(-50%, -50%)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '14px', color: '#00C896' }}>{homeTeam}</div>
          {formationHome && formationHome !== 'None' && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{formationHome}</div>}
          <div style={{ fontSize: '30px', fontWeight: 900, color: h >= a ? '#00C896' : '#8B949E', lineHeight: 1, marginTop: '4px' }}>{Math.round(h)}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>engine</div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 12px' }}>
          {typeof homeScore === 'number' && homeScore !== null
            ? <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>{homeScore} - {awayScore}</div>
            : <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>vs</div>
          }
          {gap >= 10 && <div style={{ fontSize: '10px', color: '#00C896', marginTop: '4px', fontWeight: 700 }}>{h >= a ? homeTeam : awayTeam} favoured</div>}
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '14px', color: '#993C1D' }}>{awayTeam}</div>
          {formationAway && formationAway !== 'None' && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{formationAway}</div>}
          <div style={{ fontSize: '30px', fontWeight: 900, color: a > h ? '#00C896' : '#8B949E', lineHeight: 1, marginTop: '4px' }}>{Math.round(a)}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>engine</div>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {hasLineups ? (
          <>
            <PositionalClash
              label={homeTeam + ' Attack vs ' + awayTeam + ' Defence'}
              homeZones={home.attSplit}
              awayZones={away.defSplit}
              homeColour='#185FA5'
              awayColour='#993C1D'
            />
            <MidfieldRow homeMid={home.mid} awayMid={away.mid} />
            <PositionalClash
              label={awayTeam + ' Attack vs ' + homeTeam + ' Defence'}
              homeZones={away.attSplit}
              awayZones={home.defSplit}
              homeColour='#993C1D'
              awayColour='#185FA5'
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
            Lineups confirmed closer to kick-off
          </div>
        )}
      </div>
    </div>
  )
}

function EngineMarkets({ h, a, odds, homeTeam, awayTeam }) {
  const combined = h + a
  const gap = Math.abs(h - a)
  const bttsFav = combined > 105 ? 'Yes' : combined < 88 ? 'No' : null
  const bttsConf = combined > 115 ? 'HIGH' : combined > 105 ? 'LIKELY' : combined < 80 ? 'UNLIKELY' : null

  const favTeam = h >= a ? homeTeam : awayTeam
  const favScore = Math.max(h, a)
  const undScore = Math.min(h, a)
  let csLine = null
  if (gap >= 25) csLine = '3-0'
  else if (gap >= 18) csLine = '2-0'
  else if (gap >= 12) csLine = '2-1'
  else if (gap >= 6) csLine = '1-0'

  return (
    <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', letterSpacing: '1px', marginBottom: '12px' }}>ENGINE PREDICTIONS</div>

      {bttsFav && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>Both Teams To Score</div>
            <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Combined attack score: {Math.round(combined)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <div style={{ background: '#00C89620', color: '#00C896', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>BTTS {bttsFav}</div>
            {bttsConf && <div style={{ fontSize: '10px', color: '#484F58' }}>{bttsConf}</div>}
          </div>
        </div>
      )}

      {csLine && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>Correct Score (indicative)</div>
            <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>{favTeam} advantage — gap: {Math.round(gap)}pts</div>
          </div>
          <div style={{ background: '#F0B90B20', color: '#F0B90B', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>{h >= a ? csLine : csLine.split('-').reverse().join('-')}</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
        <div style={{ fontSize: '13px', color: '#8B949E' }}>Anytime Goalscorer</div>
        <div style={{ fontSize: '11px', color: '#484F58' }}>See Tipster Picks tab</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
        <div style={{ fontSize: '13px', color: '#8B949E' }}>First Goalscorer</div>
        <div style={{ fontSize: '11px', color: '#484F58' }}>See Tipster Picks tab</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
        <div style={{ fontSize: '13px', color: '#8B949E' }}>Player Cards</div>
        <div style={{ fontSize: '11px', color: '#484F58' }}>Coming soon</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
        <div style={{ fontSize: '13px', color: '#8B949E' }}>Corners</div>
        <div style={{ fontSize: '11px', color: '#484F58' }}>Coming soon</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: '13px', color: '#8B949E' }}>Penalties</div>
        <div style={{ fontSize: '11px', color: '#484F58' }}>Coming soon</div>
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const params = useParams()
  const { plan } = usePlan()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const id = params?.id

  useEffect(() => {
    if (!id) return
    fetch('/api/matches/' + id).then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message='Loading match...' />
  if (!data?.match) return <div style={{ padding: '40px', textAlign: 'center', color: '#484F58' }}>Match not found.</div>

  const { match, latest_score: score, odds, events, picks,
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
  const scoreColour = v => v >= 70 ? '#00C896' : v >= 55 ? '#F0B90B' : '#8B949E'

  const sectionBtn = (key, label) => (
    <button key={key} onClick={() => setActiveSection(key)} style={{ padding: '8px 16px', background: activeSection === key ? '#00C896' : '#161B22', color: activeSection === key ? '#0B0E11' : '#8B949E', border: '1px solid ' + (activeSection === key ? '#00C896' : '#2A3441'), borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
      {label}
    </button>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Link href='/dashboard' style={{ fontSize: '13px', color: '#484F58', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}> Back to Today</Link>

      <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#484F58', fontWeight: 600 }}>{match.league}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isLive && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>LIVE</span>}
            {isFinished && <span style={{ background: '#2A3441', color: '#8B949E', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>FT</span>}
            {!isLive && !isFinished && <span style={{ background: '#00C89620', color: '#00C896', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>{STATE_LABELS[score?.score_state] || 'Upcoming'}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{match.home_team}</div>
            {h > 0 && <div style={{ fontSize: '26px', fontWeight: 900, color: scoreColour(h), marginTop: '4px' }}>{Math.round(h)}</div>}
            <div style={{ fontSize: '11px', color: '#484F58' }}>Engine score</div>
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
              <div style={{ marginTop: '6px', fontSize: '11px', background: '#00C89620', color: '#00C896', padding: '3px 10px', borderRadius: '10px', fontWeight: 700 }}>{fav} favoured</div>
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{match.away_team}</div>
            {a > 0 && <div style={{ fontSize: '26px', fontWeight: 900, color: scoreColour(a), marginTop: '4px' }}>{Math.round(a)}</div>}
            <div style={{ fontSize: '11px', color: '#484F58' }}>Engine score</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {sectionBtn('overview', 'Overview')}
        {sectionBtn('pitch', 'Lineup & Pitch')}
        {sectionBtn('markets', 'Bet Markets')}
        {picks.length > 0 && sectionBtn('tips', 'Tipster Picks')}
        {events.length > 0 && sectionBtn('events', 'Match Events')}
      </div>

      {activeSection === 'overview' && (
        <div>
          <PitchBlockView homeTeam={match.home_team} awayTeam={match.away_team} homeScore={match.home_score} awayScore={match.away_score} homeLineup={home_lineup} awayLineup={away_lineup} formationHome={formation_home} formationAway={formation_away} />
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
          {(home_sidelined.length > 0 || away_sidelined.length > 0) && (
            <div style={{ background: '#161B22', border: '1px solid #ef444440', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '1px', marginBottom: '10px' }}>SIDELINED / INJURIES</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {home_sidelined.length > 0 && <div style={{ flex: 1 }}><div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.home_team}</div>{home_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '3px' }}>{p.player?.name || p.name || p}</div>)}</div>}
                {away_sidelined.length > 0 && <div style={{ flex: 1 }}><div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.away_team}</div>{away_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '3px' }}>{p.player?.name || p.name || p}</div>)}</div>}
              </div>
            </div>
          )}
          <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>BET WITH</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BOOKMAKERS.map(bm => <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>)}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>18+ | Gamble responsibly | BeGambleAware.org</div>
          </div>
        </div>
      )}

      {activeSection === 'pitch' && (
        <div>
          <PitchBlockView homeTeam={match.home_team} awayTeam={match.away_team} homeScore={match.home_score} awayScore={match.away_score} homeLineup={home_lineup} awayLineup={away_lineup} formationHome={formation_home} formationAway={formation_away} />
          {(home_sidelined.length > 0 || away_sidelined.length > 0) && (
            <div style={{ background: '#161B22', border: '1px solid #ef444440', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '1px', marginBottom: '10px' }}>UNAVAILABLE PLAYERS</div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {home_sidelined.length > 0 && <div style={{ flex: 1 }}><div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.home_team}</div>{home_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>{p.player?.name || p.name || p}</div>)}</div>}
                {away_sidelined.length > 0 && <div style={{ flex: 1 }}><div style={{ fontSize: '12px', color: '#8B949E', marginBottom: '6px', fontWeight: 600 }}>{match.away_team}</div>{away_sidelined.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>{p.player?.name || p.name || p}</div>)}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'markets' && (
        <div>
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
          {odds?.over_under && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>GOALS MARKET</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={'Over ' + (odds.over_under.total || 2.5) + ' Goals'} odds={overOdds} signal={h + a > 105} colour='#185FA5' />
                <OddsCard label={'Under ' + (odds.over_under.total || 2.5) + ' Goals'} odds={underOdds} signal={h + a < 95} colour='#185FA5' />
              </div>
            </div>
          )}
          {odds?.handicap && (
            <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>ASIAN HANDICAP ({odds.handicap.market})</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <OddsCard label={match.home_team} odds={decToFrac(odds.handicap.home)} signal={false} colour='#00C896' />
                <OddsCard label={match.away_team} odds={decToFrac(odds.handicap.away)} signal={false} colour='#00C896' />
              </div>
            </div>
          )}
          <EngineMarkets h={h} a={a} odds={odds} homeTeam={match.home_team} awayTeam={match.away_team} />
          <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1px', marginBottom: '10px' }}>BET WITH</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BOOKMAKERS.map(bm => <a key={bm} href='#' target='_blank' rel='noopener noreferrer' style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#333', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>{bm}</a>)}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'tips' && picks.length > 0 && (
        <div>
          {picks.map((pick, i) => {
            const meta = PERSONA_META[pick.persona] || { name: pick.persona, colour: '#8B949E' }
            const outcomeCol = pick.outcome === 'win' ? '#00C896' : pick.outcome === 'loss' ? '#ef4444' : pick.outcome === 'void' ? '#F0B90B' : '#484F58'
            return (
              <div key={i} style={{ background: '#ffffff', border: '2px solid ' + meta.colour, borderRadius: '10px', padding: '16px', marginBottom: '12px', color: '#111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, color: meta.colour }}>{meta.name}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {pick.is_best_pick && <span style={{ background: '#F0B90B', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>BEST PICK</span>}
                    {pick.outcome && <span style={{ background: outcomeCol, color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '10px' }}>{pick.outcome.toUpperCase()}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{pick.selection} <span style={{ color: meta.colour }}>@ {pick.odds_fractional}</span></div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Stake: {GBP}{pick.stake}</div>
                {pick.tip_text && <div style={{ fontSize: '13px', color: '#444', fontStyle: 'italic', paddingLeft: '10px', borderLeft: '3px solid ' + meta.colour }}>{pick.tip_text}</div>}
                {pick.outcome && Number(pick.profit_loss) !== 0 && <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 800, color: outcomeCol }}>{Number(pick.profit_loss) > 0 ? '+' : ''}{GBP}{Math.abs(Number(pick.profit_loss)).toFixed(2)}</div>}
              </div>
            )
          })}
        </div>
      )}

      {activeSection === 'events' && (
        <div>
          {events.length === 0 ? (
            <div style={{ color: '#484F58', textAlign: 'center', padding: '40px', fontSize: '14px' }}>No events recorded yet.</div>
          ) : (
            <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '16px' }}>
              {events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2530' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ev.event_type === 'goal' ? '#00C896' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {ev.event_type === 'goal' ? 'G' : ev.event_type === 'penalty' ? 'P' : 'R'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{ev.player_name}</div>
                    <div style={{ fontSize: '12px', color: '#484F58' }}>{ev.minute ? ev.minute + 'min' : ''} {ev.event_type}</div>
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