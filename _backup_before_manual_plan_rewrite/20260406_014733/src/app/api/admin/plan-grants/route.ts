import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceRole) {
    throw new Error("Supabase admin credentials missing.");
  }

  return createClient(url, serviceRole);
}

export async function POST(request: Request) {
  await requireAdminUser();

  try {
    const body = await request.json();

    const userId = String(body.userId || "");
    const grantedByUserId = String(body.grantedByUserId || "");
    const planKey = String(body.planKey || "free").toLowerCase();
    const accessType = String(body.accessType || "permanent").toLowerCase();
    const startsAt = body.startsAt ? new Date(body.startsAt).toISOString() : new Date().toISOString();
    const expiresAt =
      accessType === "time_limited" && body.expiresAt
        ? new Date(body.expiresAt).toISOString()
        : null;
    const note = body.note ? String(body.note) : null;

    if (!userId || !grantedByUserId) {
      return NextResponse.json({ ok: false, error: "Missing user IDs." }, { status: 400 });
    }

    if (!["free", "premium", "pro"].includes(planKey)) {
      return NextResponse.json({ ok: false, error: "Invalid plan key." }, { status: 400 });
    }

    if (!["permanent", "time_limited"].includes(accessType)) {
      return NextResponse.json({ ok: false, error: "Invalid access type." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error: deactivateError } = await supabase
      .from("admin_plan_grants")
      .update({
        is_active: false,
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (deactivateError) {
      return NextResponse.json({ ok: false, error: deactivateError.message }, { status: 500 });
    }

    const { error: insertError } = await supabase
      .from("admin_plan_grants")
      .insert({
        user_id: userId,
        granted_by_user_id: grantedByUserId,
        plan_key: planKey,
        access_type: accessType,
        starts_at: startsAt,
        expires_at: expiresAt,
        note,
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown grant save error" },
      { status: 500 }
    );
  }
}