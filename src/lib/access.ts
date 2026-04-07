import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlanKey = "free" | "premium" | "pro";

const rank: Record<PlanKey, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

export async function getEffectivePlanKey(userId: string): Promise<PlanKey> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_effective_plan_key", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const value = String(data || "free").toLowerCase();

  if (value === "premium" || value === "pro") {
    return value;
  }

  return "free";
}

export async function requirePlanAccess(userId: string, minimumPlan: PlanKey) {
  const currentPlan = await getEffectivePlanKey(userId);

  if (rank[currentPlan] < rank[minimumPlan]) {
    redirect(`/pricing?required=${minimumPlan}`);
  }

  return currentPlan;
}