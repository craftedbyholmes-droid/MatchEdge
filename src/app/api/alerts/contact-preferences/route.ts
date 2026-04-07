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
      alert_email: body.alertEmail ? String(body.alertEmail) : null,
      sms_enabled: Boolean(body.smsEnabled),
      phone_number: body.phoneNumber ? String(body.phoneNumber) : null,
      timezone: body.timezone ? String(body.timezone) : "Europe/London",
      quiet_hours_enabled: Boolean(body.quietHoursEnabled),
      quiet_hours_start: body.quietHoursStart ? String(body.quietHoursStart) : null,
      quiet_hours_end: body.quietHoursEnd ? String(body.quietHoursEnd) : null,
    };

    const { error } = await supabase
      .from("user_contact_preferences")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown contact-preferences error" },
      { status: 500 }
    );
  }
}