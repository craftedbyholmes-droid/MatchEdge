"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [status, setStatus] = useState("");

  async function signInNow() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = process.env.NEXT_PUBLIC_AUTH_SUCCESS_REDIRECT || "/dashboard";
  }

  async function handleSubmit() {
    if (!email || !password) {
      setStatus("Enter email and password.");
      return;
    }

    if (mode === "login") {
      setStatus("Signing in...");
      await signInNow();
      return;
    }

    if (!agreedToTerms) {
      setStatus("You must agree to the Terms & Conditions before creating an account.");
      return;
    }

    setStatus("Creating account without email confirmation...");

    const res = await fetch("/api/dev/bootstrap-user", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setStatus(json.error || "Failed to create account.");
      return;
    }

    setStatus("Account created. Signing in...");
    await signInNow();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">MatchEdge Auth</div>
          <h1 className="mt-3 text-3xl font-semibold">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Dev/testing auth flow. Signup auto-confirms the email and signs you straight in.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-2xl px-4 py-2 text-sm ${mode === "login" ? "bg-emerald-500 text-slate-950" : "border border-white/10 bg-slate-900 text-white"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-2xl px-4 py-2 text-sm ${mode === "signup" ? "bg-emerald-500 text-slate-950" : "border border-white/10 bg-slate-900 text-white"}`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            {mode === "signup" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="/terms" className="text-emerald-300 hover:text-emerald-200">
                    Terms & Conditions
                  </Link>
                  .
                </span>
              </label>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
            >
              {mode === "login" ? "Sign in" : "Create account and sign in"}
            </button>
          </div>

          {status ? <div className="mt-4 text-sm text-slate-400">{status}</div> : null}

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">
            Dev bootstrap auth is for testing only. Disable DEV_AUTH_BOOTSTRAP before production.
          </div>
        </div>
      </div>
    </div>
  );
}