import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

const SD_KEY  = process.env.SOCCER_DATA_API_KEY
const SD_BASE = 'https://api.soccerdata.com/v1'
const WC_LEAGUE_ID = 313

async function sdFetch(path) {
  const url = SD_BASE + path + (path.includes('?') ? '&' : '?') + 'auth_token=' + SD_KEY
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip', 'Accept': 'application/json' } })
  if (!res.ok) throw new Error('SoccerData ' + res.status + ': ' + path)
  return res.json()
}

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch all WC fixtures from SoccerData
    const data = await sdFetch('/match-previews-upcoming/?league_id=' + WC_LEAGUE_ID + '&limit=200')
    const fixtures = data?.data || data?.matches || data || []

    if (!fixtures.length) return NextResponse.json({ error: 'No fixtures returned from SoccerData', raw: data }, { status: 400 })

    // Clear existing WC matches
    await supabaseAdmin.from('wc_matches').delete().neq('match_id', 'NONE')
    await supabaseAdmin.from('wc_teams').delete().neq('team_id', 'NONE')
    await supabaseAdmin.from('wc_groups').delete().neq('group_id', 'NONE')

    let inserted = 0
    const teams = {}
    const groups = new Set()

    for (const f of fixtures) {
      const matchId = 'WC_sd_' + f.id
      const homeTeam = f.home_team?.name || f.localteam?.name || ''
      const awayTeam = f.away_team?.name || f.visitorteam?.name || ''
      const kickoff  = f.date || f.time || f.kickoff
      const stage    = (f.round?.name || f.stage || 'group').toLowerCase()
      const groupName = f.group?.name || f.group || null
      const groupId  = groupName ? groupName.replace('Group ', '') : null

      if (groupId) groups.add(groupId)

      if (homeTeam) teams[homeTeam] = {
        team_id:       (f.home_team?.short_name || homeTeam.substring(0,3)).toUpperCase(),
        name:          homeTeam,
        group_id:      groupId,
        confederation: f.home_team?.confederation || ''
      }
      if (awayTeam) teams[awayTeam] = {
        team_id:       (f.away_team?.short_name || awayTeam.substring(0,3)).toUpperCase(),
        name:          awayTeam,
        group_id:      groupId,
        confederation: f.away_team?.confederation || ''
      }

      await supabaseAdmin.from('wc_matches').insert({
        match_id:     matchId,
        stage:        stage.includes('group') ? 'group' : stage,
        group_id:     groupId,
        home_team:    homeTeam,
        away_team:    awayTeam,
        kickoff_time: kickoff,
        venue:        f.venue?.name || '',
        city:         f.venue?.city || '',
        status:       'scheduled',
        sd_match_id:  f.id
      })
      inserted++
    }

    // Insert groups
    for (const g of groups) {
      await supabaseAdmin.from('wc_groups').upsert({ group_id: g, group_name: 'Group ' + g }, { onConflict: 'group_id' })
    }

    // Insert teams
    for (const [name, team] of Object.entries(teams)) {
      await supabaseAdmin.from('wc_teams').upsert({
        ...team,
        played: 0, wins: 0, draws: 0, losses: 0,
        goals_for: 0, goals_against: 0, points: 0
      }, { onConflict: 'team_id' })
    }

    return NextResponse.json({ ok: true, inserted, teams: Object.keys(teams).length, groups: groups.size })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}