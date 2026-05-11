import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchLiveScores } from '@/lib/soccerDataApi'

export const maxDuration = 60

const FINISHED = ['finished', 'FT', 'complete', 'ended', 'after_extra_time', 'after_penalties']
const LIVE     = ['live', 'in_play', 'playing', 'first_half', 'second_half', 'extra_time']

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const liveData = await fetchLiveScores()
    let updated = 0, finished = 0

    for (const match of liveData) {
      const fixtureId = 'sd_' + match.sd_match_id
      const isFinished = FINISHED.includes(match.status?.toLowerCase())
      const isLive = LIVE.includes(match.status?.toLowerCase())
      if (!isFinished && !isLive) continue

      const updateData = {
        status: isFinished ? 'FT' : 'live',
        score_state: isFinished ? 6 : 5
      }

      // Write scores if available
      if (match.home_goals !== null && match.home_goals !== undefined) {
        updateData.home_score = match.home_goals
        updateData.away_score = match.away_goals
      }
      if (match.home_ht_goals !== null) {
        updateData.home_ht_score = match.home_ht_goals
        updateData.away_ht_score = match.away_ht_goals
      }

      await supabaseAdmin.from('matches')
        .update(updateData)
        .eq('fixture_id', fixtureId)

      if (isFinished) finished++
      else updated++
    }

    // Also check for any matches past kickoff still showing scheduled
    // Fetch their scores directly from SoccerData
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const { data: stale } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, sd_match_id, home_team, away_team')
      .in('status', ['scheduled', 'pre-match'])
      .lt('kickoff_time', cutoff)
      .limit(20)

    for (const match of (stale || [])) {
      try {
        const sdId = match.sd_match_id || match.fixture_id.replace('sd_', '')
        const { fetchMatch } = await import('@/lib/soccerDataApi')
        const detail = await fetchMatch(sdId)
        if (!detail) continue
        const isFinished = FINISHED.includes(detail._raw?.status?.toLowerCase())
        if (!isFinished) continue
        await supabaseAdmin.from('matches').update({
          status: 'FT',
          score_state: 6,
          home_score: detail.home_ft_goals ?? null,
          away_score: detail.away_ft_goals ?? null,
          home_ht_score: detail.home_ht_goals ?? null,
          away_ht_score: detail.away_ht_goals ?? null
        }).eq('fixture_id', match.fixture_id)
        finished++
      } catch(err) { console.error('Stale match update error:', match.fixture_id, err.message) }
    }

    return NextResponse.json({ ok: true, live: updated, finished })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}