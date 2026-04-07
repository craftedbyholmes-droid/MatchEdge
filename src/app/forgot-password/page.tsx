"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Sending reset link...");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setStatus(json.error || "Unable to send reset email.");
      return;
    }

    setStatus("Reset link sent. Check your inbox and spam folder.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">MatchEdge</div>
        <h1 className="mt-4 text-3xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-sm text-slate-400">
          Enter your account email and we will send you a password reset link.
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

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
          >
            Send reset link
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