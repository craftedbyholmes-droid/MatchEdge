import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseAllowlist() {
  return (process.env.ADMIN_ALLOWLIST_EMAILS || "craftedbyholmes@gmail.com")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireUser();
  const email = String(user.email || "").toLowerCase();
  const allowlist = parseAllowlist();

  if (!allowlist.includes(email)) {
    redirect("/dashboard");
  }

  return user;
}