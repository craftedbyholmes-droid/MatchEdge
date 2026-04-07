import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const authToken = cookieStore.get("sb-access-token")?.value || "";

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRole);

  let userId: string | null = null;

  try {
    const {
      data: { user },
    } = await userClient.auth.getUser();
    userId = user?.id || null;
  } catch {
    userId = null;
  }

  const body = await request.json();

  const bookmakerKey = String(body.bookmakerKey || "");
  const bookmakerName = String(body.bookmakerName || "");
  const destinationUrl = String(body.destinationUrl || "");
  const sourcePage = String(body.sourcePage || "");
  const opportunityId = String(body.opportunityId || "");

  const { error } = await adminClient.from("affiliate_click_log").insert({
    user_id: userId,
    bookmaker_key: bookmakerKey,
    bookmaker_name: bookmakerName,
    destination_url: destinationUrl,
    source_page: sourcePage,
    opportunity_id: opportunityId,
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (userId) {
    await adminClient.rpc("increment_affiliate_click_counter_safe", { target_user_id: userId });
  }

  return Response.json({ ok: true });
}