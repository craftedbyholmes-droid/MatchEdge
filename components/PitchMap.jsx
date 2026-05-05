'use client'

const POSITION_COORDS = {
  'Goalkeeper': [[50, 88]],
  'Defender':   [[20, 72],[37, 72],[63, 72],[80, 72]],
  'Midfielder': [[25, 52],[50, 52],[75, 52],[50, 44],[35, 58],[65, 58]],
  'Attacker':   [[30, 28],[50, 22],[70, 28],[50, 32]]
}

const USED_POSITIONS = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Attacker: 0 }

function getCoord(position, usedCount) {
  const coords = POSITION_COORDS[position] || POSITION_COORDS['Midfielder']
  return coords[usedCount % coords.length]
}

export default function PitchMap({ homeLineup, awayLineup, homeTeam, awayTeam, formation_home, formation_away }) {
  const used = { home: { Goalkeeper: 0, Defender: 0, Midfielder: 0, Attacker: 0 }, away: { Goalkeeper: 0, Defender: 0, Midfielder: 0, Attacker: 0 } }

  const homePlayers = (homeLineup || []).map(p => {
    const pos = p.position
    const coord = getCoord(pos, used.home[pos] || 0)
    used.home[pos] = (used.home[pos] || 0) + 1
    return { ...p, x: coord[0], y: coord[1], side: 'home' }
  })

  const awayPlayers = (awayLineup || []).map(p => {
    const pos = p.position
    const awayY = 100 - (getCoord(pos, used.away[pos] || 0)[1])
    const awayX = getCoord(pos, used.away[pos] || 0)[0]
    used.away[pos] = (used.away[pos] || 0) + 1
    return { ...p, x: awayX, y: awayY, side: 'away' }
  })

  const allPlayers = [...homePlayers, ...awayPlayers]

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      {/* Team labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>
        <span style={{ color: '#22c55e' }}>{homeTeam} {formation_home && formation_home !== 'None' ? '(' + formation_home + ')' : ''}</span>
        <span style={{ color: '#4d9fff' }}>{awayTeam} {formation_away && formation_away !== 'None' ? '(' + formation_away + ')' : ''}</span>
      </div>
      <svg viewBox='0 0 100 110' style={{ width: '100%', background: '#1a3a1a', borderRadius: '8px', border: '1px solid #2a2a3a' }}>
        {/* Pitch markings */}
        <rect x='5' y='5' width='90' height='100' fill='none' stroke='#ffffff20' strokeWidth='0.5' />
        <line x1='5' y1='55' x2='95' y2='55' stroke='#ffffff20' strokeWidth='0.5' />
        <circle cx='50' cy='55' r='10' fill='none' stroke='#ffffff20' strokeWidth='0.5' />
        <circle cx='50' cy='55' r='0.8' fill='#ffffff30' />
        {/* Penalty areas */}
        <rect x='22' y='5' width='56' height='16' fill='none' stroke='#ffffff20' strokeWidth='0.5' />
        <rect x='22' y='89' width='56' height='16' fill='none' stroke='#ffffff20' strokeWidth='0.5' />
        <rect x='35' y='5' width='30' height='8' fill='none' stroke='#ffffff15' strokeWidth='0.4' />
        <rect x='35' y='97' width='30' height='8' fill='none' stroke='#ffffff15' strokeWidth='0.4' />
        {/* Goals */}
        <rect x='40' y='3' width='20' height='3' fill='none' stroke='#ffffff40' strokeWidth='0.5' />
        <rect x='40' y='104' width='20' height='3' fill='none' stroke='#ffffff40' strokeWidth='0.5' />
        {/* Players */}
        {allPlayers.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r='4.2'
              fill={p.side === 'home' ? '#22c55e' : '#4d9fff'}
              stroke={p.side === 'home' ? '#16a34a' : '#2563eb'}
              strokeWidth='0.6'
              opacity='0.9'
            />
            <text
              x={p.x}
              y={p.y + 0.8}
              textAnchor='middle'
              dominantBaseline='middle'
              fontSize='2.2'
              fill='#fff'
              fontWeight='bold'
            >
              {p.player?.name?.split(' ').pop()?.substring(0, 6) || '?'}
            </text>
          </g>
        ))}
        {/* Direction arrows */}
        <text x='50' y='52' textAnchor='middle' fontSize='3' fill='#ffffff30'>▼ attack</text>
        <text x='50' y='61' textAnchor='middle' fontSize='3' fill='#ffffff30'>▲ attack</text>
      </svg>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
        <span><span style={{ color: '#22c55e' }}>●</span> {homeTeam}</span>
        <span><span style={{ color: '#4d9fff' }}>●</span> {awayTeam}</span>
      </div>
    </div>
  )
}