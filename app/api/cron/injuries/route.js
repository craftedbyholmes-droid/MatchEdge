import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchInjuries } from '@/lib/footballApi'

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const injuries = await fetchInjuries()
    let updated = 0
    for (const inj of injuries) {
      const player = inj.player
      const fixture = inj.fixture
      if (!player?.id) continue
      const status = player.reason === 'Suspended' ? 'suspended' : 'out'
      const { error } = await supabaseAdmin.from('players')
        .upsert({
          player_id: String(player.id),
          name: player.name,
          injury_status: status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'player_id' })
      if (!error) updated++
    }
    return NextResponse.json({ ok: true, updated, total: injuries.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}