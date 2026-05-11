'use client'
import { useState, useEffect } from 'react'
import { usePlan } from '@/lib/usePlan'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const CRON_SECRET = process.env.NEXT_PUBLIC_CRON_SECRET

const CRON_BUTTONS = [
  { label: 'Fetch Fixtures',  path: '/api/cron',              desc: 'Pull all upcoming fixtures from SoccerData' },
  { label: 'Standings',       path: '/api/cron/standings',    desc: 'Fetch all league tables - run before Score' },
  { label: 'Injuries',        path: '/api/cron/injuries',     desc: 'Update sidelined and injury data' },
  { label: 'Score',           path: '/api/cron/score',        desc: 'Run engine on all upcoming fixtures' },
  { label: 'Projected',       path: '/api/cron/projected',    desc: 'Advance score state for projected lineups' },
  { label: 'Lineups',         path: '/api/cron/lineups',      desc: 'Poll for confirmed lineups' },
  { label: 'Bench Impact',    path: '/api/cron/bench-impact', desc: 'Calculate bench impact flags' },
  { label: 'Cache',           path: '/api/cron/cache',        desc: 'Rebuild matches_today cache' },
  { label: 'Personas',        path: '/api/personas',          desc: 'Generate tipster picks for next matchday' },
  { label: 'Live',            path: '/api/cron/live',         desc: 'Update live scores' },
  { label: 'Settle',          path: '/api/cron/settle',       desc: 'Settle picks and update P&L' },
  { label: 'Rollup',          path: '/api/cron/rollup',       desc: 'Write match events to player stats' },
  { label: 'Calibrate',       path: '/api/cron/calibrate',    desc: 'Generate weekly weight suggestions' },
  { label: 'Fetch Results', path: '/api/admin/fetch-results', desc: 'Fetch scores for past matches and mark FT' },
  { label: 'Midnight Chain',  path: '/api/cron/midnight',     desc: 'Full midnight pipeline' }
]

export default function AdminPage() {
  const { user } = usePlan()
  const router = useRouter()
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(null)
  const [giftEmail, setGiftEmail] = useState('')
  const [giftExpiry, setGiftExpiry] = useState('')
  const [giftMsg, setGiftMsg] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fetchMsg, setFetchMsg] = useState('')
  const [weightData, setWeightData] = useState(null)
  const [activeSection, setActiveSection] = useState('crons')

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) router.push('/')
  }, [user])

  useEffect(() => {
    if (activeSection === 'weights') loadWeights()
  }, [activeSection])

  function addLog(msg, type) {
    const ts = new Date().toLocaleTimeString('en-GB')
    setLog(l => [...l.slice(-49), { ts, msg, type: type || 'info' }])
  }

  async function runCron(path, label) {
    setRunning(label)
    addLog('Running ' + path + '...')
    try {
      const res = await fetch(path, { headers: { Authorization: 'Bearer ' + CRON_SECRET } })
      const data = await res.json()
      addLog(path + ' -- ' + JSON.stringify(data), res.ok ? 'success' : 'error')
    } catch(err) {
      addLog(path + ' -- ERROR: ' + err.message, 'error')
    }
    setRunning(null)
  }

  async function runStandingsThenScore() {
    setRunning('Standings + Score')
    addLog('Running Standings then Score...')
    try {
      const r1 = await fetch('/api/cron/standings', { headers: { Authorization: 'Bearer ' + CRON_SECRET } })
      const d1 = await r1.json()
      addLog('/api/cron/standings -- ' + JSON.stringify(d1), r1.ok ? 'success' : 'error')
      const r2 = await fetch('/api/cron/score', { headers: { Authorization: 'Bearer ' + CRON_SECRET } })
      const d2 = await r2.json()
      addLog('/api/cron/score -- ' + JSON.stringify(d2), r2.ok ? 'success' : 'error')
    } catch(err) { addLog('ERROR: ' + err.message, 'error') }
    setRunning(null)
  }

  async function grantAccess(action) {
    if (!giftEmail) { setGiftMsg('Email required'); return }
    try {
      const res = await fetch('/api/admin/gifted-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CRON_SECRET },
        body: JSON.stringify({ email: giftEmail, action, expires_at: giftExpiry || null })
      })
      const data = await res.json()
      setGiftMsg(data.ok ? action + ' successful for ' + giftEmail : 'Error: ' + data.error)
    } catch(err) { setGiftMsg('Error: ' + err.message) }
  }

  async function fetchByDateRange() {
    if (!dateFrom || !dateTo) { setFetchMsg('Both dates required'); return }
    setFetchMsg('Fetching...')
    try {
      const res = await fetch('/api/admin/fetch-range?from=' + dateFrom + '&to=' + dateTo, {
        headers: { Authorization: 'Bearer ' + CRON_SECRET }
      })
      const data = await res.json()
      setFetchMsg(JSON.stringify(data))
    } catch(err) { setFetchMsg('Error: ' + err.message) }
  }

  async function loadWeights() {
    try {
      const res = await fetch('/api/admin/weights', { headers: { Authorization: 'Bearer ' + CRON_SECRET } })
      setWeightData(await res.json())
    } catch(err) { console.error(err) }
  }

  async function reviewWeight(id, action, override) {
    await fetch('/api/admin/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CRON_SECRET },
      body: JSON.stringify({ id, action, override_weight: override })
    })
    loadWeights()
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return <div style={{ padding: '40px', color: '#484F58', textAlign: 'center' }}>Access restricted.</div>
  }

  const tabStyle = (key) => ({
    padding: '8px 18px',
    background: activeSection === key ? '#00C896' : '#1E2530',
    color: '#fff',
    border: '1px solid ' + (activeSection === key ? '#00C896' : '#2A3441'),
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600
  })

  const logColour = (type) => type === 'error' ? '#ef4444' : type === 'success' ? '#00C896' : '#8B949E'

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Admin Panel</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSection('crons')}    style={tabStyle('crons')}>Cron Controls</button>
        <button onClick={() => setActiveSection('gifted')}   style={tabStyle('gifted')}>Gifted Access</button>
        <button onClick={() => setActiveSection('daterange')}style={tabStyle('daterange')}>Date Range Fetch</button>
        <button onClick={() => setActiveSection('weights')}  style={tabStyle('weights')}>Weight Adaptations</button>
      </div>

      {activeSection === 'crons' && (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Cron Controls</div>
          <div style={{ fontSize: '12px', color: '#484F58', marginBottom: '16px' }}>Run Standings first, then Score. Order matters.</div>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#1E2530', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', border: '1px solid #00C89630' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#00C896' }}>Standings + Score (recommended)</div>
              <div style={{ fontSize: '11px', color: '#484F58', marginTop: '2px' }}>Fetches all league tables then runs engine on all fixtures</div>
            </div>
            <button onClick={runStandingsThenScore} disabled={!!running} style={{ padding: '8px 20px', background: '#00C896', color: '#0B0E11', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
              {running === 'Standings + Score' ? 'Running...' : 'Run Both'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CRON_BUTTONS.map(btn => (
              <button key={btn.label} onClick={() => runCron(btn.path, btn.label)} disabled={!!running} title={btn.desc}
                style={{ padding: '8px 14px', background: running === btn.label ? '#00C896' : '#1E2530', color: '#fff', border: '1px solid #2A3441', borderRadius: '6px', cursor: running ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: running && running !== btn.label ? 0.5 : 1 }}>
                {running === btn.label ? 'Running...' : btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'gifted' && (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>Gifted Access</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <input value={giftEmail} onChange={e => setGiftEmail(e.target.value)} placeholder='user@email.com'
              style={{ flex: 2, minWidth: '200px', padding: '8px 12px', background: '#1E2530', border: '1px solid #2A3441', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            <input type='date' value={giftExpiry} onChange={e => setGiftExpiry(e.target.value)}
              style={{ flex: 1, minWidth: '140px', padding: '8px 12px', background: '#1E2530', border: '1px solid #2A3441', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => grantAccess('grant')} style={{ padding: '8px 20px', background: '#00C896', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Grant Edge</button>
            <button onClick={() => grantAccess('revoke')} style={{ padding: '8px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Revoke</button>
          </div>
          {giftMsg && <div style={{ marginTop: '10px', fontSize: '13px', color: '#8B949E' }}>{giftMsg}</div>}
        </div>
      )}

      {activeSection === 'daterange' && (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Fetch Fixtures by Date Range</div>
          <div style={{ fontSize: '12px', color: '#484F58', marginBottom: '16px' }}>Backfill fixtures for a specific date range.</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <input type='date' value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 12px', background: '#1E2530', border: '1px solid #2A3441', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            <input type='date' value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 12px', background: '#1E2530', border: '1px solid #2A3441', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            <button onClick={fetchByDateRange} style={{ padding: '8px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Fetch</button>
          </div>
          {fetchMsg && <div style={{ fontSize: '12px', color: '#8B949E', fontFamily: 'monospace', wordBreak: 'break-all' }}>{fetchMsg}</div>}
        </div>
      )}

      {activeSection === 'weights' && (
        <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Weight Adaptations</div>
          <div style={{ fontSize: '12px', color: '#484F58', marginBottom: '16px' }}>Generated weekly by calibration cron. Approve, override or reject each suggestion.</div>
          {!weightData ? <div style={{ color: '#484F58' }}>Loading...</div>
          : weightData.pending?.length === 0 ? <div style={{ color: '#484F58', fontSize: '13px' }}>No pending suggestions. Run Calibrate to generate new ones.</div>
          : weightData.pending?.map(w => (
            <div key={w.id} style={{ background: '#1E2530', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{w.league_name}</span>
                  <span style={{ color: '#484F58', margin: '0 8px' }}>-</span>
                  <span style={{ color: '#8B949E' }}>{w.factor_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#484F58' }}>Current: <b style={{ color: '#E6EDF3' }}>{(w.current_weight * 100).toFixed(1)}%</b></span>
                  <span style={{ color: '#484F58' }}>Suggested: <b style={{ color: '#00C896' }}>{(w.suggested_weight * 100).toFixed(1)}%</b></span>
                  <span style={{ color: '#484F58' }}>({w.sample_size} matches)</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#484F58', marginBottom: '10px' }}>{w.reasoning}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => reviewWeight(w.id, 'approve', null)} style={{ padding: '5px 14px', background: '#00C896', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Approve</button>
                <button onClick={() => reviewWeight(w.id, 'reject', null)} style={{ padding: '5px 14px', background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Reject</button>
                <input placeholder='Override %' style={{ width: '90px', padding: '5px 8px', background: '#161B22', border: '1px solid #2A3441', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  onKeyDown={e => { if (e.key === 'Enter') reviewWeight(w.id, 'override', parseFloat(e.target.value) / 100) }} />
              </div>
            </div>
          ))}
          {weightData?.leagueStats && Object.keys(weightData.leagueStats).length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#8B949E' }}>PREDICTION ACCURACY BY LEAGUE</div>
              {Object.entries(weightData.leagueStats).map(([league, stats]) => (
                <div key={league} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2530', fontSize: '13px' }}>
                  <span>{league}</span>
                  <span style={{ color: stats.correct / stats.total > 0.6 ? '#00C896' : '#8B949E' }}>
                    {stats.correct}/{stats.total} ({Math.round(stats.correct / stats.total * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#0B0E11', border: '1px solid #1E2530', borderRadius: '8px', padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#484F58' }}>ACTIVITY LOG</div>
        {log.length === 0
          ? <div style={{ color: '#484F58', fontSize: '12px' }}>No activity yet. Run a cron above.</div>
          : [...log].reverse().map((entry, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '11px', color: logColour(entry.type), padding: '3px 0', borderBottom: '1px solid #111' }}>
              [{entry.ts}] {entry.msg}
            </div>
          ))
        }
      </div>
    </div>
  )
}