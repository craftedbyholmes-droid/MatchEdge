import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export const maxDuration = 60

const FINISHED = ['finished', 'ft', 'complete', 'ended', 'after_extra_time', 'after_penalties']
const LIVE     = ['live', 'in_play', 'playing', 'first_half', 'second_half', 'extra_time', 'halftime', 'half_time']
const SD_KEY   = process.env.SOCCER_DATA_API_KEY
const SD_BASE  = 'https://api.soccerdata.com/v1'

async function sdFetch(path) {
  const url = SD_BASE + path + (path.includes('?') ? '&' : '?') + 'auth_token=' + SD_KEY
  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip', 'Accept': 'application/json' }
  })
  if (!res.ok) throw new Error('SoccerData error: ' + res.status + ' ' + path)
  return res.json()
}

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Step 1 - get livescores to find which matches are live or just finished
    const liveData = await sdFetch('/livescores/')
    const liveMatches = liveData?.livescores?.livescore || []

    // Step 2 - also check DB for matches that kicked off in last 3 hours
    // that might not appear in livescores feed
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()
    const { data: recentMatches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, sd_match_id, home_team, away_team, status')
      .gte('kickoff_time', threeHoursAgo)
      .lte('kickoff_time', now)
      .not('sd_match_id', 'is', null)

    // Build set of sd_match_ids to call /match/ on
    const toFetch = new Set()

    for (const lm of liveMatches) {
      const status = (lm.status || '').toLowerCase()
      if (FINISHED.includes(status) || LIVE.includes(status)) {
        if (lm.id) toFetch.add(String(lm.id))
      }
    }
    for (const rm of (recentMatches || [])) {
      if (rm.sd_match_id) toFetch.add(String(rm.sd_match_id))
    }

    let updated = 0, finished = 0, goalEvents = 0

    // Step 3 - call /match/ on EVERY live/recent match to get full data
    for (const sdId of toFetch) {
      try {
        const detail = await sdFetch('/match/?match_id=' + sdId)
        const match = detail?.match
        if (!match) continue

        const status = (match.status || '').toLowerCase()
        const isFinished = FINISHED.includes(status)
        const isLive = LIVE.includes(status)
        if (!isFinished && !isLive) continue

        const fixtureId = 'sd_' + sdId

        // Extract scores
        const homeScore = match.stats?.home_score ?? match.home_goals ?? null
        const awayScore = match.stats?.away_score ?? match.away_goals ?? null
        const homeHT = match.stats?.home_score_half ?? null
        const awayHT = match.stats?.away_score_half ?? null

        // Update match record
        await supabaseAdmin.from('matches').update({
          status:        isFinished ? 'FT' : 'live',
          score_state:   isFinished ? 6 : 5,
          home_score:    homeScore,
          away_score:    awayScore,
          home_ht_score: homeHT,
          away_ht_score: awayHT
        }).eq('fixture_id', fixtureId)

        // Step 4 - extract and store goal events (this is what we need for Pez)
        const events = match.events || []
        const goals = events.filter(e => {
          const type = (e.type || e.event_type || '').toLowerCase()
          return type === 'goal' || type === 'penalty' || type === 'own_goal'
        })

        for (const goal of goals) {
          const playerId = goal.player?.id || goal.player_id || null
          const playerName = goal.player?.name || goal.player_name || null
          const teamId = goal.team?.id || goal.team_id || null
          const minute = goal.minute || goal.match_minute || null
          const type = (goal.type || goal.event_type || 'goal').toLowerCase()

          if (!playerName) continue

          const eventId = fixtureId + '_goal_' + (playerId || playerName.replace(/\\s/g, '')) + '_' + (minute || '0')

          await supabaseAdmin.from('match_event_log').upsert({
            event_id:    eventId,
            fixture_id:  fixtureId,
            match_date:  new Date().toISOString().split('T')[0],
            player_id:   playerId,
            player_name: playerName,
            team_id:     teamId,
            event_type:  type,
            minute:      minute
          }, { onConflict: 'event_id', ignoreDuplicates: true })

          goalEvents++
        }

        if (isFinished) finished++
        else updated++

      } catch(err) {
        console.error('Live match fetch error:', sdId, err.message)
      }
    }

    return NextResponse.json({ ok: true, live: updated, finished, goalEvents, fetched: toFetch.size })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}