'use client'

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '20px' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #1c1c28', borderTop: '3px solid #0F6E56', animation: 'me-spin 0.9s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width='28' height='28' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='50' cy='50' r='48' fill='#e8e8f0' stroke='#2a2a3a' strokeWidth='3'/>
            <polygon points='50,18 62,28 58,42 42,42 38,28' fill='#1c1c28'/>
            <polygon points='50,82 62,72 58,58 42,58 38,72' fill='#1c1c28'/>
            <polygon points='18,50 28,38 42,42 42,58 28,62' fill='#1c1c28'/>
            <polygon points='82,50 72,38 58,42 58,58 72,62' fill='#1c1c28'/>
          </svg>
        </div>
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>{message}</div>
      <style>{@keyframes me-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }}</style>
    </div>
  )
}