import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function logExecution(entry: {
  opportunityId: string;
  eventName: string;
  bookmaker: string;
  stake: number;
  odds: number;
}) {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not signed in.");
  }

  const potentialReturn = Number((entry.stake * entry.odds).toFixed(2));

  const { error } = await supabase.from("user_execution_log").insert({
    user_id: user.id,
    opportunity_id: entry.opportunityId,
    event_name: entry.eventName,
    bookmaker: entry.bookmaker,
    stake: Number(entry.stake.toFixed(2)),
    odds: Number(entry.odds.toFixed(4)),
    potential_return: potentialReturn,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function settleExecution(entryId: string, actualProfit: number) {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("user_execution_log")
    .update({
      actual_profit: Number(actualProfit.toFixed(2)),
      status: "settled",
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}