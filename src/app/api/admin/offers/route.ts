import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    const body = await request.json();
    const supabase = createSupabaseAdminClient();

    const payload = {
      bookmaker_key: String(body.bookmakerKey || "").trim().toLowerCase(),
      bookmaker_name: String(body.bookmakerName || "").trim(),
      offer_type: String(body.offerType || "welcome").trim(),
      headline: String(body.headline || "").trim(),
      short_description: body.shortDescription ? String(body.shortDescription) : null,
      stake_requirement: body.stakeRequirement ? String(body.stakeRequirement) : null,
      reward_value: body.rewardValue ? String(body.rewardValue) : null,
      reward_type: body.rewardType ? String(body.rewardType) : null,
      min_odds: body.minOdds ? String(body.minOdds) : null,
      qualifying_instructions: body.qualifyingInstructions ? String(body.qualifyingInstructions) : null,
      region: body.region ? String(body.region) : "uk",
      affiliate_url: body.affiliateUrl ? String(body.affiliateUrl) : null,
      source_key: body.sourceKey ? String(body.sourceKey) : "manual_admin",
      source_url: body.sourceUrl ? String(body.sourceUrl) : null,
      status: body.status ? String(body.status) : "draft",
      sort_priority: Number(body.sortPriority || 100),
      reviewed_by_user_id: adminUser.id,
      reviewed_at: new Date().toISOString(),
      last_change_summary: body.changeSummary ? String(body.changeSummary) : "Manual admin update",
    };

    if (!payload.bookmaker_key || !payload.bookmaker_name || !payload.headline) {
      return NextResponse.json(
        { ok: false, error: "Bookmaker key, bookmaker name, and headline are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("offers")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { error: logError } = await supabase.from("offer_change_log").insert({
      offer_id: data.id,
      changed_by_user_id: adminUser.id,
      change_type: "created",
      summary: payload.last_change_summary,
      after_data: payload,
    });

    if (logError) {
      return NextResponse.json({ ok: false, error: logError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown offers admin error" },
      { status: 500 }
    );
  }
}