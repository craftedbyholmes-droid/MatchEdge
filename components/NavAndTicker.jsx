'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'
import { LogoCompact } from '@/components/Logo'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function NavAndTicker() {
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ticker, setTicker] = useState([])
  const [scrolled, setScrolled] = useState(false)
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

  return (
    <>
      <nav style={{ background: navBg, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, padding: '0 16px', backdropFilter: scrolled ? 'blur(8px)' : 'none', transition: 'background 0.2s' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px' }}>
          <LogoCompact />
          {isMobile ? (
            <button onClick={() => setMenuOpen(o => !o)} aria-label='Menu' style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {menuOpen ? 'x' : '='}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              {links.map(l => (
                <Link key={l.href} href={l.href} style={{ color: l.highlight ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: l.highlight ? 700 : 400, textDecoration: 'none' }}>{l.label}</Link>
              ))}
              {isAdmin && <Link href='/admin' style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 700, background: 'var(--gold-dim)', border: '1px solid #F0B90B30', padding: '3px 10px', borderRadius: '4px', textDecoration: 'none' }}>Admin</Link>}
            </div>
          )}
        </div>
        {isMobile && menuOpen && (
          <div style={{ background: '#0B0E11', borderTop: '1px solid var(--border)', padding: '8px 0 12px' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: l.highlight ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: l.highlight ? 700 : 400, textDecoration: 'none', fontSize: '14px' }}>{l.label}</Link>
            ))}
            {isAdmin && <Link href='/admin' onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: 'var(--gold)', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>Admin</Link>}
            <div style={{ margin: '10px 16px 0', padding: '10px 12px', background: 'var(--card)', border: '1px solid #ef444430', borderLeft: '3px solid #ef4444', borderRadius: '0 6px 6px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>18+</span>
              Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: 'var(--text-secondary)' }}>BeGambleAware.org</a>
            </div>
          </div>
        )}
      </nav>
      {ticker.length > 0 && (
        <div style={{ background: '#0B0E11', borderBottom: '1px solid var(--border)', padding: '5px 16px', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {ticker.map((t, i) => (
            <span key={i} style={{ marginRight: '32px' }}>
              <span style={{ color: t.outcome === 'win' ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>{t.outcome === 'win' ? 'WIN' : 'LOSS'}</span>
              {' '}{t.selection} <span style={{ color: 'var(--text-muted)' }}>({t.persona})</span> {t.odds_fractional}
            </span>
          ))}
        </div>
      )}
    </>
  )
}