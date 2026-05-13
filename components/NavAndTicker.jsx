'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'
import { LogoCompact } from '@/components/Logo'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const PERSONA_LABELS = { gordon: 'Gordon', stan: 'Stan', pez: 'Pez' }

export default function NavAndTicker() {
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ticker, setTicker] = useState([])
  const [scrolled, setScrolled] = useState(false)
  const tickerRef = useRef(null)
  const { plan, user } = usePlan()
  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/stats?ticker=true').then(r => r.json()).then(d => setTicker(d.ticker || [])).catch(() => {})
  }, [])

  // Auto-scroll ticker
  useEffect(() => {
    if (!ticker.length || !tickerRef.current) return
    const el = tickerRef.current
    let pos = 0
    const speed = 0.5
    let raf
    function step() {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [ticker])

  const links = [
    { href: '/dashboard',    label: 'Today' },
    { href: '/upcoming',     label: 'Upcoming' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/worldcup',     label: 'World Cup', highlight: true },
    { href: '/tipsters',     label: 'Tipsters' },
    { href: '/results',      label: 'Results' },
    { href: '/pricing',      label: 'Pricing' },
    { href: '/account',      label: 'Account' },
  ]

  const navBg = scrolled ? 'rgba(11,14,17,0.95)' : '#0B0E11'

  function outcomeColour(o) {
    if (o === 'win')  return '#00C896'
    if (o === 'loss') return '#ef4444'
    return '#F0B90B'
  }

  // Double the ticker items so scroll loops seamlessly
  const tickerItems = [...ticker, ...ticker]

  return (
    <>
      <nav style={{ background: navBg, borderBottom: '1px solid #2A3441', position: 'sticky', top: 0, zIndex: 100, padding: '0 16px', backdropFilter: scrolled ? 'blur(8px)' : 'none', transition: 'background 0.2s' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px' }}>
          <LogoCompact />
          {isMobile ? (
            <button onClick={() => setMenuOpen(o => !o)} aria-label='Menu' style={{ background: 'none', border: '1px solid #2A3441', borderRadius: '6px', color: '#E6EDF3', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {menuOpen ? 'x' : '='}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              {links.map(l => (
                <Link key={l.href} href={l.href} style={{ color: l.highlight ? '#F0B90B' : '#8B949E', fontSize: '13px', fontWeight: l.highlight ? 700 : 400, textDecoration: 'none' }}>{l.label}</Link>
              ))}
              {isAdmin && <Link href='/admin' style={{ color: '#F0B90B', fontSize: '13px', fontWeight: 700, background: '#F0B90B20', border: '1px solid #F0B90B30', padding: '3px 10px', borderRadius: '4px', textDecoration: 'none' }}>Admin</Link>}
            </div>
          )}
        </div>
        {isMobile && menuOpen && (
          <div style={{ background: '#0B0E11', borderTop: '1px solid #2A3441', padding: '8px 0 12px' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: l.highlight ? '#F0B90B' : '#8B949E', fontWeight: l.highlight ? 700 : 400, textDecoration: 'none', fontSize: '14px' }}>{l.label}</Link>
            ))}
            {isAdmin && <Link href='/admin' onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: '#F0B90B', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>Admin</Link>}
          </div>
        )}
      </nav>
      {ticker.length > 0 && (
        <div style={{ background: '#0B0E11', borderBottom: '1px solid #2A3441', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '12px' }}>
          <div ref={tickerRef} style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '6px 0' }}>
            <span style={{ display: 'inline-block' }}>
              {tickerItems.map((t, i) => (
                <span key={i} style={{ marginRight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: outcomeColour(t.outcome), color: '#000', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>{(t.outcome || '').toUpperCase()}</span>
                  <span style={{ color: '#E6EDF3', fontWeight: 600 }}>
                    {t.home_team && t.away_team ? t.home_team + ' vs ' + t.away_team : t.selection}
                  </span>
                  <span style={{ color: '#8B949E' }}>{t.selection}</span>
                  <span style={{ color: '#484F58' }}>@ {t.odds_fractional}</span>
                  <span style={{ color: '#484F58' }}>({PERSONA_LABELS[t.persona] || t.persona})</span>
                  {t.profit_loss !== 0 && (
                    <span style={{ color: outcomeColour(t.outcome), fontWeight: 700 }}>
                      {Number(t.profit_loss) > 0 ? '+' : ''}{String.fromCharCode(163)}{Math.abs(Number(t.profit_loss)).toFixed(2)}
                    </span>
                  )}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </>
  )
}