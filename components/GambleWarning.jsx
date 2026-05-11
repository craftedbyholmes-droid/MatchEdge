'use client'

export default function GambleWarning({ compact = false }) {
  if (compact) {
    return (
      <div style={{ background: '#0B0E11', borderTop: '2px solid var(--border)', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>18+</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Please gamble responsibly.</span>
        <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'underline' }}>BeGambleAware.org</a>
        <a href='tel:08088020133' style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>0808 802 0133</a>
      </div>
    )
  }
  return (
    <div style={{ background: '#0B0E11', borderTop: '2px solid #1a2a1a', padding: '24px 16px', marginTop: '40px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ background: 'var(--card)', border: '1px solid #ef444430', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0', padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', letterSpacing: '1.5px', flexShrink: 0 }}>18+</span>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Gambling can be harmful. Please play responsibly.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>MatchEdge provides tips for information and entertainment only. We do not accept bets. Always gamble within your means.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Get help:</span>
          {[
            { name: 'BeGambleAware.org', url: 'https://www.begambleaware.org' },
            { name: 'GamCare', url: 'https://www.gamcare.org.uk' },
            { name: 'GamStop', url: 'https://www.gamstop.co.uk' },
            { name: 'Gambling Therapy', url: 'https://www.gamblingtherapy.org' }
          ].map(r => (
            <a key={r.name} href={r.url} target='_blank' rel='noopener noreferrer' style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--card-raised)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '4px', textDecoration: 'none' }}>
              {r.name}
            </a>
          ))}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Free helpline:</span>
          <a href='tel:08088020133' style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>0808 802 0133</a>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(24/7, free)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width='20' height='20' viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <polygon points='18,1 35,13 35,23 18,35 1,23 1,13' fill='#00C896' />
              <circle cx='18' cy='18' r='6.5' fill='none' stroke='rgba(255,255,255,0.3)' strokeWidth='0.9'/>
              <line x1='4' y1='18' x2='32' y2='18' stroke='rgba(255,255,255,0.2)' strokeWidth='0.8'/>
              <circle cx='18' cy='18' r='1.2' fill='rgba(255,255,255,0.5)'/>
              <line x1='22' y1='5' x2='32' y2='14' stroke='#F0B90B' strokeWidth='2.5' strokeLinecap='round'/>
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: 'var(--text-muted)' }}>
              Match<span style={{ color: 'var(--primary)' }}>Edge</span> (c) 2026
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href='/terms' style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
            <a href='/privacy' style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
            <a href='/pricing' style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>
      </div>
    </div>
  )
}