import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserPerformance(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_execution_log")
    .select("id, created_at, amount_staked, amount_returned, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let cumulativeStake = 0;
  let cumulativeProfit = 0;

  return (data || []).map((row, index) => {
    const stake = Number(row.amount_staked || 0);
    const returned = Number(row.amount_returned || 0);
    const settled = String(row.status || "").toLowerCase() === "settled";
    const profitLoss = settled ? Number((returned - stake).toFixed(2)) : 0;

    cumulativeStake += stake;
    cumulativeProfit += profitLoss;

    return {
      id: row.id,
      label: `#${index + 1}`,
      date: row.created_at,
      stake: Number(cumulativeStake.toFixed(2)),
      total: Number((cumulativeStake + cumulativeProfit).toFixed(2)),
      profitLoss: Number(cumulativeProfit.toFixed(2)),
    };
  });
}

export async function getExecutionLogRows(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_execution_log")
    .select("id, event_name, bookmaker_names, amount_staked, amount_returned, status, created_at, settled_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => {
    const stake = Number(row.amount_staked || 0);
    const returned = Number(row.amount_returned || 0);
    const settled = String(row.status || "").toLowerCase() === "settled";

    return {
      ...row,
      profit_loss: settled ? Number((returned - stake).toFixed(2)) : 0,
    };
  });
}