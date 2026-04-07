"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [over18Confirmed, setOver18Confirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!over18Confirmed) {
      setStatus("You must confirm that you are 18 or over to continue.");
      return;
    }

    if (!termsConfirmed) {
      setStatus("You must accept the Terms and confirm the responsible gambling notice to continue.");
      return;
    }

    setStatus("Signing in...");

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">MatchEdge</div>
        <h1 className="mt-4 text-3xl font-semibold">Log in to your account</h1>
        <p className="mt-3 text-sm text-slate-400">
          Access your dashboard, compare opportunities, profit planner, alerts, and saved bets.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                Password
              </label>

              <Link href="/forgot-password" className="text-xs text-cyan-300 underline">
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={over18Confirmed}
              onChange={(e) => setOver18Confirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm that I am 18 or over and legally permitted to access betting-related content in my region.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I accept the{" "}
              <Link href="/terms" className="text-cyan-300 underline">
                Terms
              </Link>
              {" "}and understand that betting involves risk. Please gamble responsibly.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
          >
            Log in
          </button>
        </form>

        {status ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {status}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-slate-400">
          Need an account?{" "}
          <Link href="/signup" className="text-cyan-300 underline">
            Create one
          </Link>
        </div>
      </div>
    </main>
  );
}