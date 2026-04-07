import { NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo =
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown forgot-password error",
      },
      { status: 500 }
    );
  }
}