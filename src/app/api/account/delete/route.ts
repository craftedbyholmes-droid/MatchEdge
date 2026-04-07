import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  const supabaseUser = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: cookieStore.get("sb-access-token")?.value
            ? `Bearer ${cookieStore.get("sb-access-token")?.value}`
            : "",
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  // DELETE USER (CASCADE WILL HANDLE REST)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}