import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ExecutionLegInput = {
  bookmaker: string;
  bookmakerKey?: string;
  stake: number;
  odds: number;
};

export async function logExecution(entry: {
  opportunityId: string;
  eventName: string;
  eventDate?: string | null;
  kind?: string;
  legs: ExecutionLegInput[];
  sourcePage?: string;
  notes?: string[];
}) {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not signed in.");
  }

  const amountStaked = Number(
    entry.legs.reduce((sum, leg) => sum + Number(leg.stake || 0), 0).toFixed(2)
  );

  const amountReturned = Number(
    Math.min(...entry.legs.map((leg) => Number(leg.stake || 0) * Number(leg.odds || 0))).toFixed(2)
  );

  const bookmakerKeys = entry.legs.map((leg) => String(leg.bookmakerKey || "")).filter(Boolean);
  const bookmakerNames = entry.legs.map((leg) => leg.bookmaker);

  const { error } = await supabase.from("user_execution_log").insert({
    user_id: user.id,
    opportunity_id: entry.opportunityId,
    event_name: entry.eventName,
    event_date: entry.eventDate || null,
    bookmaker_keys: bookmakerKeys,
    bookmaker_names: bookmakerNames,
    amount_staked: amountStaked,
    amount_returned: amountReturned,
    status: "pending",
    execution_source: entry.sourcePage || null,
    opportunity_kind: entry.kind || null,
    notes: entry.notes?.length ? entry.notes.join(" | ") : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function settleExecution(entryId: string, actualReturned: number) {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("user_execution_log")
    .update({
      amount_returned: Number(actualReturned.toFixed(2)),
      status: "settled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markExecutionVoid(entryId: string) {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("user_execution_log")
    .update({
      status: "void",
      settled_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function cancelExecution(entryId: string) {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("user_execution_log")
    .update({
      status: "cancelled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}