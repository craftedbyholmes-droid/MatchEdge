// Default weights - used before calibration data exists
export const DEFAULT_WEIGHTS = {
  standing:     0.25,
  h2h:          0.15,
  home_adv:     0.10,
  odds:         0.20,
  ai_pred:      0.10,
  form:         0.10,
  sidelined:    0.05,
  intl_synergy: 0.05
}

// League-specific weight overrides based on tactical characteristics
export const LEAGUE_TACTICAL_PRIORS = {
  'English Premier League': { standing: 0.20, h2h: 0.12, home_adv: 0.10, odds: 0.25, ai_pred: 0.12, form: 0.12, sidelined: 0.06, intl_synergy: 0.03 },
  'Scottish Premiership':   { standing: 0.28, h2h: 0.18, home_adv: 0.12, odds: 0.18, ai_pred: 0.08, form: 0.08, sidelined: 0.05, intl_synergy: 0.03 },
  '2. Bundesliga':          { standing: 0.26, h2h: 0.14, home_adv: 0.10, odds: 0.20, ai_pred: 0.10, form: 0.12, sidelined: 0.05, intl_synergy: 0.03 },
  'Ligue 2':                { standing: 0.28, h2h: 0.14, home_adv: 0.10, odds: 0.18, ai_pred: 0.10, form: 0.12, sidelined: 0.05, intl_synergy: 0.03 },
  'Segunda Division':       { standing: 0.30, h2h: 0.16, home_adv: 0.08, odds: 0.18, ai_pred: 0.10, form: 0.10, sidelined: 0.05, intl_synergy: 0.03 },
  'Serie B':                { standing: 0.30, h2h: 0.18, home_adv: 0.08, odds: 0.16, ai_pred: 0.10, form: 0.10, sidelined: 0.05, intl_synergy: 0.03 },
  'Premier League': { standing: 0.20, h2h: 0.12, home_adv: 0.10, odds: 0.25, ai_pred: 0.12, form: 0.12, sidelined: 0.06, intl_synergy: 0.03 },
  'Premiership':    { standing: 0.28, h2h: 0.18, home_adv: 0.12, odds: 0.18, ai_pred: 0.08, form: 0.08, sidelined: 0.05, intl_synergy: 0.03 },
  'Bundesliga':     { standing: 0.22, h2h: 0.14, home_adv: 0.10, odds: 0.22, ai_pred: 0.12, form: 0.12, sidelined: 0.05, intl_synergy: 0.03 },
  'La Liga':        { standing: 0.30, h2h: 0.16, home_adv: 0.08, odds: 0.18, ai_pred: 0.12, form: 0.08, sidelined: 0.05, intl_synergy: 0.03 },
  'Ligue 1':        { standing: 0.28, h2h: 0.14, home_adv: 0.10, odds: 0.20, ai_pred: 0.10, form: 0.10, sidelined: 0.05, intl_synergy: 0.03 },
  'Serie A':        { standing: 0.32, h2h: 0.18, home_adv: 0.08, odds: 0.16, ai_pred: 0.10, form: 0.08, sidelined: 0.05, intl_synergy: 0.03 },
  'World Cup':      { standing: 0.15, h2h: 0.12, home_adv: 0.05, odds: 0.18, ai_pred: 0.12, form: 0.12, sidelined: 0.08, intl_synergy: 0.18 },
  'Champions League':{ standing: 0.18, h2h: 0.14, home_adv: 0.08, odds: 0.22, ai_pred: 0.12, form: 0.12, sidelined: 0.07, intl_synergy: 0.07 }
}

// Fetch live weights from DB, fall back to priors
export async function getLeagueWeights(supabaseAdmin, leagueName) {
  try {
    const { data } = await supabaseAdmin
      .from('league_weights')
      .select('*')
      .eq('league_name', leagueName)
      .single()
    if (data && data.sample_size >= 20) {
      return {
        standing:     data.standing_weight,
        h2h:          data.h2h_weight,
        home_adv:     data.home_adv_weight,
        odds:         data.odds_weight,
        ai_pred:      data.ai_pred_weight,
        form:         data.form_weight,
        sidelined:    data.sidelined_weight,
        intl_synergy: data.intl_synergy_weight
      }
    }
  } catch(err) { console.error('getLeagueWeights error:', err.message) }
  return LEAGUE_TACTICAL_PRIORS[leagueName] || DEFAULT_WEIGHTS
}

// Blend weights for inter-league competitions (World Cup, UCL)
export function blendWeights(homeLeague, awayLeague, competitionLeague) {
  const home = LEAGUE_TACTICAL_PRIORS[homeLeague] || DEFAULT_WEIGHTS
  const away = LEAGUE_TACTICAL_PRIORS[awayLeague] || DEFAULT_WEIGHTS
  const comp = LEAGUE_TACTICAL_PRIORS[competitionLeague] || DEFAULT_WEIGHTS
  const blended = {}
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    blended[key] = Math.round(((home[key] + away[key]) / 2 * 0.6 + comp[key] * 0.4) * 1000) / 1000
  }
  const total = Object.values(blended).reduce((a, b) => a + b, 0)
  for (const key of Object.keys(blended)) blended[key] = Math.round(blended[key] / total * 1000) / 1000
  return blended
}