import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const payload = {
      user_id: user.id,
      title: String(body.title || "").trim(),
      enabled: true,
      strategy_mode: String(body.strategyMode || "profit"),
      min_profit_percent: Number(body.minProfitPercent || 0),
      sport_keys: Array.isArray(body.sportKeys) ? body.sportKeys.map(String) : [],
      bookmaker_include: Array.isArray(body.bookmakerInclude) ? body.bookmakerInclude.map(String) : [],
      bookmaker_exclude: Array.isArray(body.bookmakerExclude) ? body.bookmakerExclude.map(String) : [],
      kickoff_window_hours: body.kickoffWindowHours ? Number(body.kickoffWindowHours) : null,
      cooldown_minutes: Number(body.cooldownMinutes || 60),
      trigger_type: String(body.triggerType || "new_match"),
      digest_mode: String(body.digestMode || "instant"),
      delivery_in_app: Boolean(body.deliveryInApp),
      delivery_email: Boolean(body.deliveryEmail),
      delivery_sms: Boolean(body.deliverySms),
      quiet_hours_override: false,
    };

    if (!payload.title) {
      return NextResponse.json({ ok: false, error: "Rule title is required." }, { status: 400 });
    }

    const { error } = await supabase.from("alert_rules").insert(payload);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown alert-rules error" },
      { status: 500 }
    );
  }
}