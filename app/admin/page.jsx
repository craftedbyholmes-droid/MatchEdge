'use client'
import { useState } from 'react'
import { usePlan } from '@/lib/usePlan'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const CRON = process.env.NEXT_PUBLIC_CRON_SECRET
const H = { 'Content-Type': 'application/json', 'authorization': 'Bearer ' + CRON }

export default function AdminPage() {
  const { user } = usePlan()
  const [log, setLog] = useState([])
  const [giftEmail, setGiftEmail] = useState('')
  const [giftExpiry, setGiftExpiry] = useState('')
  const [giftMsg, setGiftMsg] = useState('')
  const [fetchFrom, setFetchFrom] = useState('')
  const [fetchTo, setFetchTo] = useState('')
  const [socialPersona, setSocialPersona] = useState('gordon')
  const [fixtureId, setFixtureId] = useState('')
  const [market, setMarket] = useState('match_result')
  const [selection, setSelection] = useState('')
  const [oddsFrac, setOddsFrac] = useState('')
  const [oddsDec, setOddsDec] = useState('')
  const [score, setScore] = useState('')
  const [generatedPost, setGeneratedPost] = useState(null)
  const [postId, setPostId] = useState('')
  const [outcome, setOutcome] = useState('win')
  const [finalScore, setFinalScore] = useState('')

  const isAdmin = user?.email === ADMIN_EMAIL

  function addLog(msg, ok) {
    const ts = new Date().toLocaleTimeString()
    setLog(l => [...l, { ts, msg, ok }])
  }

  async function cronCall(path) {
    addLog('Running ' + path + '...', null)
    try {
      const res = await fetch(path, { headers: H })
      const data = await res.json()
      addLog(path + ' — ' + JSON.stringify(data), res.ok)
    } catch(err) { addLog(path + ' ERROR: ' + err.message, false) }
  }

  async function fetchDateRange() {
    if (!fetchFrom) { addLog('Select a start date.', false); return }
    const to = fetchTo || fetchFrom
    addLog('Fetching fixtures ' + fetchFrom + ' to ' + to + '...', null)
    try {
      const res = await fetch('/api/admin/fetch-range?from=' + fetchFrom + '&to=' + to, { headers: H })
      const data = await res.json()
      if (data.ok) {
        addLog('Fetched ' + data.inserted + ' fixtures from ' + data.dateFrom + ' to ' + data.dateTo + '. Now run Score then Cache.', true)
      } else {
        addLog('Error: ' + (data.error || JSON.stringify(data)), false)
      }
    } catch(err) { addLog('Fetch error: ' + err.message, false) }
  }

  async function grantAccess(action) {
    if (!giftEmail) { setGiftMsg('Enter an email address.'); return }
    try {
      const res = await fetch('/api/admin/gifted-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: giftEmail, action, expires_at: giftExpiry || null }) })
      const data = await res.json()
      setGiftMsg(data.message || data.error)
    } catch(err) { setGiftMsg(err.message) }
  }

  async function generatePost() {
    if (!fixtureId || !selection || !oddsFrac) { addLog('Fill in fixture ID, selection and odds.', false); return }
    addLog('Generating post for ' + socialPersona + '...', null)
    try {
      const res = await fetch('/api/admin/social/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona: socialPersona, fixtureId, market, selection, oddsFractional: oddsFrac, oddsDecimal: parseFloat(oddsDec) || 2.0, engineScore: parseInt(score) || 70, stake: 10 }) })
      const data = await res.json()
      if (data.ok) { setGeneratedPost(data.posts); setPostId(data.postId); addLog('Post generated. ID: ' + data.postId, true) }
      else addLog('Error: ' + data.error, false)
    } catch(err) { addLog(err.message, false) }
  }

  async function logResult() {
    if (!postId || !finalScore) { addLog('Enter post ID and final score.', false); return }
    try {
      const res = await fetch('/api/admin/social/result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, outcome, finalScore }) })
      const data = await res.json()
      if (data.ok) addLog('Result logged. P+L: ' + data.profitLoss, true)
      else addLog('Error: ' + data.error, false)
    } catch(err) { addLog(err.message, false) }
  }

  const iS = { padding: '8px 10px', background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '4px', color: '#e8e8f0', fontSize: '16px', width: '100%' }
  const btn = (col) => ({ padding: '8px 14px', background: col || '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '4px', color: col ? '#fff' : '#ccc', cursor: 'pointer', fontSize: '13px', fontWeight: 600 })
  const sec = { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '20px', marginBottom: '16px' }

  if (!user) return <div style={{ padding: '40px 0', color: '#6b7280' }}>Loading...</div>
  if (!isAdmin) return <div style={{ padding: '40px 0' }}><h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>Access Denied</h1></div>

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Admin Panel</h1>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '16px' }}>Cron Controls</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[['/api/cron','Fetch Today+Tomorrow'],['/api/cron/injuries','Injuries'],['/api/cron/score','Score'],['/api/cron/projected','Projected'],['/api/cron/lineups','Lineups'],['/api/cron/bench-impact','Bench Impact'],['/api/cron/cache','Cache'],['/api/personas','Personas'],['/api/cron/live','Live'],['/api/cron/settle','Settle'],['/api/cron/rollup','Rollup'],['/api/cron/midnight','Midnight Chain']].map(([path, label]) => (
            <button key={path} onClick={() => cronCall(path)} style={btn()}>{label}</button>
          ))}
        </div>
      </div>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Fetch Fixtures by Date Range</h2>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '14px' }}>Pulls from football-data.org — no date restrictions. Use for weekend fixtures. Then run Score and Cache.</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>From</div>
            <input style={iS} type='date' value={fetchFrom} onChange={e => setFetchFrom(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>To</div>
            <input style={iS} type='date' value={fetchTo} onChange={e => setFetchTo(e.target.value)} />
          </div>
          <button onClick={fetchDateRange} style={btn('#185FA5')}>Fetch Fixtures</button>
        </div>
      </div>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '16px' }}>Gifted Access</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <input style={{ ...iS, flex: '1 1 200px' }} placeholder='user@email.com' value={giftEmail} onChange={e => setGiftEmail(e.target.value)} />
          <input style={{ ...iS, flex: '1 1 150px' }} type='date' value={giftExpiry} onChange={e => setGiftExpiry(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => grantAccess('grant')} style={btn('#0F6E56')}>Grant Edge Access</button>
          <button onClick={() => grantAccess('revoke')} style={btn('#ef4444')}>Revoke Access</button>
        </div>
        {giftMsg && <div style={{ marginTop: '10px', fontSize: '13px', color: '#9ca3af' }}>{giftMsg}</div>}
      </div>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '16px' }}>Social Tool — Generate Post</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <select style={{ ...iS, flex: '1 1 120px' }} value={socialPersona} onChange={e => setSocialPersona(e.target.value)}>
            <option value='gordon'>Gaffer Gordon</option>
            <option value='stan'>Stats Stan</option>
            <option value='pez'>Punter Pez</option>
          </select>
          <input style={{ ...iS, flex: '1 1 120px' }} placeholder='Fixture ID' value={fixtureId} onChange={e => setFixtureId(e.target.value)} />
          <select style={{ ...iS, flex: '1 1 140px' }} value={market} onChange={e => setMarket(e.target.value)}>
            <option value='match_result'>Match Result</option>
            <option value='btts'>BTTS</option>
            <option value='over_25'>Over 2.5</option>
            <option value='anytime_scorer'>Anytime Scorer</option>
            <option value='cards'>Cards</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <input style={{ ...iS, flex: '2 1 200px' }} placeholder='Selection (e.g. Arsenal Win)' value={selection} onChange={e => setSelection(e.target.value)} />
          <input style={{ ...iS, flex: '1 1 80px' }} placeholder='Odds frac' value={oddsFrac} onChange={e => setOddsFrac(e.target.value)} />
          <input style={{ ...iS, flex: '1 1 80px' }} placeholder='Odds dec' value={oddsDec} onChange={e => setOddsDec(e.target.value)} />
          <input style={{ ...iS, flex: '1 1 80px' }} placeholder='Score' value={score} onChange={e => setScore(e.target.value)} />
        </div>
        <button onClick={generatePost} style={btn('#185FA5')}>Generate Post</button>
        {generatedPost && (
          <div style={{ marginTop: '14px' }}>
            {[['Twitter/X', generatedPost.short],['Bluesky', generatedPost.bluesky],['Reddit', generatedPost.long],['Facebook', generatedPost.fb]].map(([platform, text]) => (
              <div key={platform} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>{platform}</div>
                <textarea readOnly value={text} style={{ ...iS, height: '80px', resize: 'vertical', fontSize: '12px', fontFamily: 'monospace' }} />
                <button onClick={() => navigator.clipboard.writeText(text)} style={{ ...btn(), fontSize: '11px', padding: '4px 10px', marginTop: '2px' }}>Copy</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '16px' }}>Social Tool — Log Result</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <input style={{ ...iS, flex: '2 1 200px' }} placeholder='Post ID' value={postId} onChange={e => setPostId(e.target.value)} />
          <input style={{ ...iS, flex: '1 1 80px' }} placeholder='Score e.g. 2-1' value={finalScore} onChange={e => setFinalScore(e.target.value)} />
          <select style={{ ...iS, flex: '1 1 100px' }} value={outcome} onChange={e => setOutcome(e.target.value)}>
            <option value='win'>Win</option>
            <option value='loss'>Loss</option>
            <option value='void'>Void</option>
          </select>
        </div>
        <button onClick={logResult} style={btn('#0F6E56')}>Log Result</button>
      </div>

      <div style={sec}>
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '16px' }}>Activity Log</h2>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          {log.length === 0 && <div style={{ color: '#4b5563' }}>No activity yet.</div>}
          {log.map((l, i) => (
            <div key={i} style={{ color: l.ok === true ? '#22c55e' : l.ok === false ? '#ef4444' : '#9ca3af', marginBottom: '4px' }}>
              [{l.ts}] {l.msg}
            </div>
          ))}
        </div>
        {log.length > 0 && <button onClick={() => setLog([])} style={{ ...btn(), marginTop: '10px', fontSize: '11px' }}>Clear Log</button>}
      </div>
    </div>
  )
}