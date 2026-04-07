"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const STORAGE_KEY = "matchedge-cookie-choice-v1";

export function CookieBanner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      setVisible(true);
    }
  }, []);

  async function persist(analytics: boolean, marketing: boolean) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        essential: true,
        analytics,
        marketing,
        savedAt: new Date().toISOString(),
      })
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("cookie_preferences").upsert({
          user_id: user.id,
          essential: true,
          analytics,
          marketing,
        });

        await supabase.from("privacy_consents").insert([
          { user_id: user.id, consent_type: "analytics_cookies", granted: analytics, policy_version: "v1" },
          { user_id: user.id, consent_type: "marketing_cookies", granted: marketing, policy_version: "v1" },
        ]);
      }
    } catch {
    }

    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div className="text-lg font-semibold text-white">Cookies & Privacy Choices</div>
          <p className="mt-2 text-sm text-slate-300">
            We use essential cookies for sign-in and core functions. You can also choose whether to allow analytics and marketing cookies.
            Read more in our{" "}
            <Link href="/cookies" className="text-emerald-300 hover:text-emerald-200">Cookies page</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-emerald-300 hover:text-emerald-200">Privacy Notice</Link>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => persist(false, false)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white">
            Essential Only
          </button>
          <button type="button" onClick={() => persist(true, false)} className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            Allow Analytics
          </button>
          <button type="button" onClick={() => persist(true, true)} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}