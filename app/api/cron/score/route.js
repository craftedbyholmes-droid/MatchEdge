import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch, fetchMatchPreview, fetchH2H, fetchStandings, COVERED_LEAGUES } from '@/lib/soccerDataApi'
import { scoreMatch } from '@/lib/scorer'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    // Fetch all unscored scheduled matches
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', twoWeeks + 'T23:59:59Z')

    if (!matches?.length) return NextResponse.json({ ok: true, scored: 0 })

    // Pre-fetch standings for all covered leagues
    const standings = {}
    for (const [leagueName, meta] of Object.entries(COVERED_LEAGUES)) {
      try {
        const s = await fetchStandings(meta.sd_id)
        if (s?.stage?.[0]?.standings) {
          standings[leagueName] = s.stage[0].standings
        }
      } catch(err) { console.error('standings error:', leagueName, err.message) }
    }

    let scored = 0
    let errors = 0

    for (const match of matches) {
      try {
        const sdMatchId = match.sd_match_id || match.fixture_id?.replace('sd_', '')
        if (!sdMatchId) continue

        // Fetch match detail, preview and H2H in parallel
        const [matchDetail, preview] = await Promise.all([
          fetchMatch(sdMatchId),
          fetchMatchPreview(sdMatchId)
        ])

        // Get H2H if we have team IDs
        let h2h = null
        if (matchDetail?.teams?.home?.id && matchDetail?.teams?.away?.id) {
          h2h = await fetchH2H(matchDetail.teams.home.id, matchDetail.teams.away.id)
        }

        // Find standings for home and away teams
        const leagueStandings = standings[match.league] || []
        const homeStanding = leagueStandings.find(s => s.team_name === match.home_team || s.team_id === matchDetail?.teams?.home?.id)
        const awayStanding = leagueStandings.find(s => s.team_name === match.away_team || s.team_id === matchDetail?.teams?.away?.id)

        // Run scoring engine
        const result = scoreMatch({ matchDetail, h2h, homeStanding, awayStanding, preview })

        // Determine score state
        let scoreState = 1
        if (matchDetail?.lineups?.lineup_type === 'confirmed') scoreState = 4
        else if (matchDetail?.lineups?.lineup_type === 'projected') scoreState = 3
        else if (preview?.match_data) scoreState = 2

        // Save to match_scores
        const scoreId = match.fixture_id + '_state' + scoreState
        await supabaseAdmin.from('match_scores').upsert({
          score_id: scoreId,
          fixture_id: match.fixture_id,
          score_state: scoreState,
          total_home: result.total_home,
          total_away: result.total_away,
          momentum_direction: result.momentum_direction,
          momentum_strength: result.momentum_strength,
          modifiers: result.factors,
          created_at: new Date().toISOString()
        }, { onConflict: 'score_id' })

        // Update match score_state
        await supabaseAdmin.from('matches')
          .update({ score_state: scoreState })
          .eq('fixture_id', match.fixture_id)

        scored++
      } catch(err) {
        console.error('Score error for', match.fixture_id, ':', err.message)
        errors++
      }
    }

    return NextResponse.json({ ok: true, scored, errors, total: matches.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}