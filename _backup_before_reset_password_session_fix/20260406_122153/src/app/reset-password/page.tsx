"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!password || password.length < 8) {
      setStatus("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setStatus("Updating password...");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Password updated. You can now log in with your new password.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">MatchEdge</div>
        <h1 className="mt-4 text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-3 text-sm text-slate-400">
          Set a new password for your account, then return to login.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
              Confirm password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
          >
            Update password
          </button>
        </form>

        {status ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {status}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-slate-400">
          <Link href="/login" className="text-cyan-300 underline">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}