'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function NavAndTicker() {
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ticker, setTicker] = useState([])
  const { plan, user } = usePlan()
  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  return (
    <>
      <nav style={{ background: '#0d0d14', borderBottom: '1px solid #2a2a3a', position: 'sticky', top: 0, zIndex: 100, padding: '0 16px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          <Link href='/' style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>Match<span style={{ color: '#0F6E56' }}>Edge</span></Link>
          {isMobile ? (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>{menuOpen ? 'x' : '='}</button>
          ) : (
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              {links.map(l => <Link key={l.href} href={l.href} style={{ color: l.highlight ? '#f0c040' : '#ccc', fontSize: '13px', fontWeight: l.highlight ? 700 : 400 }}>{l.label}</Link>)}
              {isAdmin && <Link href='/admin' style={{ color: '#f0c040', fontSize: '13px', fontWeight: 600 }}>Admin</Link>}
            </div>
          )}
        </div>
        {isMobile && menuOpen && (
          <div style={{ background: '#0d0d14', borderTop: '1px solid #2a2a3a', padding: '12px 0' }}>
            {links.map(l => <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: l.highlight ? '#f0c040' : '#ccc', fontWeight: l.highlight ? 700 : 400 }}>{l.label}</Link>)}
            {isAdmin && <Link href='/admin' onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', color: '#f0c040' }}>Admin</Link>}
          </div>
        )}
      </nav>
      {ticker.length > 0 && (
        <div style={{ background: '#111118', borderBottom: '1px solid #2a2a3a', padding: '6px 16px', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '13px', color: '#aaa' }}>
          {ticker.map((t, i) => (
            <span key={i} style={{ marginRight: '32px' }}>
              <span style={{ color: t.outcome === 'win' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{t.outcome === 'win' ? 'WIN' : 'LOSS'}</span>
              {' '}{t.selection} ({t.persona}) {t.odds_fractional}
            </span>
          ))}
        </div>
      )}
    </>
  )
}