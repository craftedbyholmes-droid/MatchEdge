'use client'
import Link from 'next/link'

export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
      <polygon points='18,1 35,13 35,23 18,35 1,23 1,13' fill='#00C896' />
      <circle cx='18' cy='18' r='6.5' fill='none' stroke='rgba(255,255,255,0.3)' strokeWidth='0.9'/>
      <line x1='4' y1='18' x2='32' y2='18' stroke='rgba(255,255,255,0.2)' strokeWidth='0.8'/>
      <circle cx='18' cy='18' r='1.2' fill='rgba(255,255,255,0.5)'/>
      <line x1='22' y1='5' x2='32' y2='14' stroke='#F0B90B' strokeWidth='2.5' strokeLinecap='round'/>
      <line x1='24' y1='3.5' x2='34' y2='12.5' stroke='#F0B90B' strokeWidth='1' strokeLinecap='round' opacity='0.4'/>
    </svg>
  )
}

export function LogoFull({ size = 36, linkTo = '/' }) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <LogoMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: Math.round(size * 0.52) + 'px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Match<span style={{ color: 'var(--primary)' }}>Edge</span>
        </div>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: Math.round(size * 0.25) + 'px', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '2px', textTransform: 'uppercase' }}>
          Football Intelligence
        </div>
      </div>
    </div>
  )
  if (!linkTo) return inner
  return <Link href={linkTo} style={{ textDecoration: 'none' }}>{inner}</Link>
}

export function LogoCompact({ linkTo = '/' }) {
  return (
    <Link href={linkTo} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
      <LogoMark size={30} />
      <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
        Match<span style={{ color: 'var(--primary)' }}>Edge</span>
      </span>
    </Link>
  )
}