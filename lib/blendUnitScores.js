import supabaseAdmin from '@/lib/supabase'

// Blend unit interaction scores into the main engine score
// Unit scores add up to 25% weight when available
export async function blendUnitScores(fixtureId, currentHome, currentAway) {
  try {
    const { data: units } = await supabaseAdmin
      .from('unit_scores')
      .select('unit_total_home, unit_total_away, attack_clash_home, attack_clash_away, midfield_clash')
      .eq('fixture_id', fixtureId)
      .single()

    if (!units) return { home: currentHome, away: currentAway, unitBlended: false }

    // Blend: 75% existing engine score + 25% unit interaction score
    const UNIT_WEIGHT = 0.25
    const ENGINE_WEIGHT = 0.75

    const blendedHome = (currentHome * ENGINE_WEIGHT) + (units.unit_total_home * UNIT_WEIGHT)
    const blendedAway = (currentAway * ENGINE_WEIGHT) + (units.unit_total_away * UNIT_WEIGHT)

    return {
      home: Math.round(blendedHome * 10) / 10,
      away: Math.round(blendedAway * 10) / 10,
      unitBlended: true,
      unitHome: units.unit_total_home,
      unitAway: units.unit_total_away
    }
  } catch(err) {
    console.error('blendUnitScores error:', err.message)
    return { home: currentHome, away: currentAway, unitBlended: false }
  }
}