export function calcPlayerRating(player) {
  const s = player.season_stats || {}
  const f = player.form_last_10 || []
  const pos = player.position || 'CM'
  let r = 50
  if (['ST','CF'].includes(pos)) r = (s.goals||0)*8 + (s.assists||0)*4 + (s.shots_on_target||0)*2 + (s.match_rating||6.5)*4
  else if (['LW','RW','AM'].includes(pos)) r = (s.goals||0)*6 + (s.assists||0)*6 + (s.key_passes||0)*3 + (s.match_rating||6.5)*4
  else if (['CM','DM'].includes(pos)) r = (s.pass_accuracy||75)*0.4 + (s.key_passes||0)*3 + (s.tackles||0)*2 + (s.interceptions||0)*2 + (s.match_rating||6.5)*4
  else if (['CB','LB','RB'].includes(pos)) r = (s.tackles||0)*3 + (s.interceptions||0)*3 + (s.pass_accuracy||75)*0.3 + (s.match_rating||6.5)*5
  else if (pos === 'GK') r = (s.saves||0)*3 + (s.clean_sheets||0)*8 + (s.match_rating||6.5)*5
  r = Math.min(r, 95) * (0.7 + Math.min((s.minutes_played||0)/900,1)*0.3)
  if (f.length >= 5) r += (f.reduce((a,b)=>a+b,0)/f.length - 6.5) * 2
  r *= (player.recovery_modifier||1.0) * (player.adaptation_multiplier||1.0)
  return Math.max(0, Math.min(100, Math.round(r*10)/10))
}
const FZ = { '4-3-3':{def:4,mid:2,wide:4}, '4-2-3-1':{def:5,mid:2,wide:3}, '4-4-2':{def:4,mid:2,wide:4}, '3-5-2':{def:3,mid:3,wide:4}, '5-3-2':{def:5,mid:3,wide:2} }
export function calcFormationWeights(h, a) {
  const hf = FZ[h] || {def:4,mid:2,wide:4}
  const af = FZ[a] || {def:4,mid:2,wide:4}
  const cl = (v,mn,mx) => Math.max(mn,Math.min(mx,v))
  const ca = cl(-(hf.mid-af.mid)*0.045,-0.14,0.14)
  const wa = cl(-(hf.wide-af.wide)*0.045,-0.14,0.14)
  let cW=0.55+ca, wW=0.30+wa, sW=0.15-(ca+wa)
  if(cW<0.08){sW-=(0.08-cW);cW=0.08} if(wW<0.08){sW-=(0.08-wW);wW=0.08} if(sW<0.08){cW-=(0.08-sW);sW=0.08}
  return { central: Math.round(cW*100)/100, wide: Math.round(wW*100)/100, setpiece: Math.round(sW*100)/100 }
}
export function calcMatchTempo(hPPDA, aPPDA) {
  const cl = (v,mn,mx) => Math.max(mn,Math.min(mx,v))
  const hPI = cl((12-(hPPDA||9))/6,0,1)
  const aPI = cl((12-(aPPDA||9))/6,0,1)
  const tempo = (hPI+aPI)/2
  return { tempo, homePressIntensity: hPI, awayPressIntensity: aPI, xGMultiplier: 1+(tempo-0.5)*0.2 }
}