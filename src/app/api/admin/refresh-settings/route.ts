import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceRole) {
    throw new Error("Supabase admin credentials missing.");
  }

  return createClient(url, serviceRole);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const refreshMode = String(body.refreshMode || "hourly");
    const refreshIntervalMinutes = Number(body.refreshIntervalMinutes || 60);

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("platform_config")
      .update({
        refresh_mode: refreshMode,
        refresh_interval_minutes: refreshIntervalMinutes,
      })
      .neq("refresh_mode", "");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown refresh settings error" },
      { status: 500 }
    );
  }
}