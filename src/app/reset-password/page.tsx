"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function parseHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    type: params.get("type"),
  };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("Preparing password reset...");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      const supabase = createSupabaseBrowserClient();

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            if (!cancelled) {
              setStatus(error.message);
            }
            return;
          }

          if (!cancelled) {
            setSessionReady(true);
            setStatus("Recovery session ready. Enter your new password.");
          }
          return;
        }

        const hash = parseHashParams(window.location.hash);

        if (hash.type === "recovery" && hash.accessToken && hash.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.accessToken,
            refresh_token: hash.refreshToken,
          });

          if (error) {
            if (!cancelled) {
              setStatus(error.message);
            }
            return;
          }

          if (!cancelled) {
            setSessionReady(true);
            setStatus("Recovery session ready. Enter your new password.");
          }
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (!cancelled) {
            setStatus(error.message);
          }
          return;
        }

        if (data.session) {
          if (!cancelled) {
            setSessionReady(true);
            setStatus("Recovery session ready. Enter your new password.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("Reset link is missing or expired. Please request a new password reset email.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Unable to prepare reset session.");
        }
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!sessionReady) {
      setStatus("Recovery session is not ready yet. Please use the reset link from your email again.");
      return;
    }

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
              disabled={!sessionReady}
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
              disabled={!sessionReady}
            />
          </div>

          <button
            type="submit"
            disabled={!sessionReady}
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
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