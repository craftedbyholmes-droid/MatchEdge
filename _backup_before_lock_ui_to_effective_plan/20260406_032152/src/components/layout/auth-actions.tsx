"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthActions() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState("");

  async function signOut() {
    setStatus("Signing out...");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/login";
  }

  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Account & Legal
        </div>
        <div className="mt-3 grid gap-2">
          <Link
            href="/settings"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
          >
            Settings
          </Link>
          <Link
            href="/privacy-centre"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
          >
            Privacy Centre
          </Link>
          <Link
            href="/privacy"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
          >
            Privacy Notice
          </Link>
          <Link
            href="/cookies"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
          >
            Cookies
          </Link>
          <Link
            href="/terms"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
          >
            Terms
          </Link>
          <Link
            href="/pricing"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          >
            Premium Plans
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
      >
        Sign out
      </button>

      {status ? <div className="text-xs text-slate-400">{status}</div> : null}
    </div>
  );
}