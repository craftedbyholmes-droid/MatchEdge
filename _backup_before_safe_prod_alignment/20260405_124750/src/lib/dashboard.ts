import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserPerformance(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_execution_log")
    .select("created_at, stake, actual_profit")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let cumulativeStake = 0;
  let cumulativeProfit = 0;

  return (data || []).map((row, index) => {
    cumulativeStake += Number(row.stake || 0);
    cumulativeProfit += Number(row.actual_profit || 0);

    return {
      label: `#${index + 1}`,
      date: row.created_at,
      stake: Number(cumulativeStake.toFixed(2)),
      total: Number((cumulativeStake + cumulativeProfit).toFixed(2)),
    };
  });
}