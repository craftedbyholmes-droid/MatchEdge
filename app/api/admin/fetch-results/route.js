import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch } from '@/lib/soccerDataApi'

export const maxDuration = 60

const FINISHED = ['finished', 'FT', 'complete', 'ended', 'after_extra_time', 'after_penalties']

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    // Get all matches that are past kickoff with no score
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
    const now = new Date().toISOString()
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, sd_match_id, home_team, away_team, status, home_score')
      .lt('kickoff_time', now)
      .gte('kickoff_time', twoDaysAgo)
      .or('home_score.is.null,status.eq.scheduled,status.eq.finished')
      .limit(50)

    let updated = 0, errors = 0
    for (const match of (matches || [])) {
      try {
        const sdId = match.sd_match_id || match.fixture_id.replace('sd_', '')
        const detail = await fetchMatch(sdId)
        if (!detail) continue
        const rawStatus = (detail._raw?.status || '').toLowerCase()
        const isFinished = FINISHED.includes(rawStatus)
        if (!isFinished) continue
        await supabaseAdmin.from('matches').update({
          status:        'FT',
          score_state:   6,
          home_score:    detail.home_ft_goals ?? null,
          away_score:    detail.away_ft_goals ?? null,
          home_ht_score: detail.home_ht_goals ?? null,
          away_ht_score: detail.away_ht_goals ?? null
        }).eq('fixture_id', match.fixture_id)
        updated++
      } catch(err) { errors++; console.error(match.fixture_id, err.message) }
    }
    return NextResponse.json({ ok: true, updated, errors, checked: matches?.length || 0 })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}