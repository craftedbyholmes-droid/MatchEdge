'use client'

export default function ScoreRing({ score, size = 52, showLabel = true }) {
  if (!score || score <= 0) return null
  const s = Math.round(Math.min(100, Math.max(0, score)))
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (s / 100) * circ
  const colour = s >= 75 ? '#00C896' : s >= 50 ? '#F0B90B' : '#8B949E'
  const fontSize = size < 44 ? size * 0.28 : size * 0.26
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill='none' stroke='#2A3441' strokeWidth='5' />
        <circle cx={size/2} cy={size/2} r={r} fill='none' stroke={colour} strokeWidth='5'
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap='round'
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x='50%' y='50%' textAnchor='middle' dominantBaseline='middle'
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: fontSize + 'px', fontWeight: 800, fill: colour, fontFamily: 'Inter, sans-serif' }}>
          {s}
        </text>
      </svg>
      {showLabel && <div style={{ fontSize: '9px', color: '#484F58', letterSpacing: '0.5px' }}>SCORE</div>}
    </div>
  )
}