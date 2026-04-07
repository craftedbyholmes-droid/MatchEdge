"use client";

import { useMemo, useState } from "react";
import { ALERT_SPORT_OPTIONS } from "@/lib/alerts";

type AlertRule = {
  id: string;
  title: string;
  enabled: boolean;
  strategy_mode: string | null;
  min_profit_percent: number | null;
  sport_keys: string[] | null;
  delivery_in_app: boolean;
  delivery_email: boolean;
  delivery_sms: boolean;
  bookmaker_include: string[] | null;
  bookmaker_exclude: string[] | null;
  kickoff_window_hours: number | null;
  cooldown_minutes: number;
  trigger_type: string;
  digest_mode: string;
  quiet_hours_override: boolean;
  created_at: string;
  last_triggered_at: string | null;
};

type Delivery = {
  id: string;
  event_name: string | null;
  sport_key: string | null;
  trigger_reason: string | null;
  delivery_channel: string;
  delivery_status: string;
  created_at: string;
};

type ContactPreferences = {
  alert_email: string | null;
  sms_enabled: boolean;
  phone_number: string | null;
  timezone: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
} | null;

export function AlertsManager({
  initialRules,
  initialDeliveries,
  initialContact,
}: {
  initialRules: AlertRule[];
  initialDeliveries: Delivery[];
  initialContact: ContactPreferences;
}) {
  const [title, setTitle] = useState("");
  const [strategyMode, setStrategyMode] = useState("profit");
  const [minProfitPercent, setMinProfitPercent] = useState("1.0");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [bookmakerInclude, setBookmakerInclude] = useState("");
  const [bookmakerExclude, setBookmakerExclude] = useState("");
  const [kickoffWindowHours, setKickoffWindowHours] = useState("6");
  const [cooldownMinutes, setCooldownMinutes] = useState("60");
  const [triggerType, setTriggerType] = useState("new_match");
  const [digestMode, setDigestMode] = useState("instant");
  const [deliveryInApp, setDeliveryInApp] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState(Boolean(initialContact?.alert_email));
  const [deliverySms, setDeliverySms] = useState(Boolean(initialContact?.sms_enabled));
  const [alertEmail, setAlertEmail] = useState(initialContact?.alert_email || "");
  const [smsEnabled, setSmsEnabled] = useState(Boolean(initialContact?.sms_enabled));
  const [phoneNumber, setPhoneNumber] = useState(initialContact?.phone_number || "");
  const [timezone, setTimezone] = useState(initialContact?.timezone || "Europe/London");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(Boolean(initialContact?.quiet_hours_enabled));
  const [quietHoursStart, setQuietHoursStart] = useState(initialContact?.quiet_hours_start || "22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState(initialContact?.quiet_hours_end || "08:00");
  const [status, setStatus] = useState("");

  const summary = useMemo(() => {
    const active = initialRules.filter((rule) => rule.enabled).length;
    const emailRules = initialRules.filter((rule) => rule.delivery_email).length;
    const smsRules = initialRules.filter((rule) => rule.delivery_sms).length;

    return {
      active,
      emailRules,
      smsRules,
      lastDelivery: initialDeliveries[0]?.created_at || null,
    };
  }, [initialRules, initialDeliveries]);

  function toggleSport(key: string) {
    setSelectedSports((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }

  async function saveContactPreferences() {
    setStatus("Saving contact preferences...");

    const response = await fetch("/api/alerts/contact-preferences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        alertEmail,
        smsEnabled,
        phoneNumber,
        timezone,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setStatus(json.error || "Unable to save contact preferences.");
      return;
    }

    setStatus("Contact preferences saved. Refresh the page to confirm the latest values.");
  }

  async function saveRule() {
    if (!title.trim()) {
      setStatus("Give the alert rule a title first.");
      return;
    }

    setStatus("Saving alert rule...");

    const response = await fetch("/api/alerts/rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        strategyMode,
        minProfitPercent: Number(minProfitPercent || 0),
        sportKeys: selectedSports,
        bookmakerInclude: bookmakerInclude
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        bookmakerExclude: bookmakerExclude
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        kickoffWindowHours: Number(kickoffWindowHours || 0),
        cooldownMinutes: Number(cooldownMinutes || 60),
        triggerType,
        digestMode,
        deliveryInApp,
        deliveryEmail,
        deliverySms,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setStatus(json.error || "Unable to save alert rule.");
      return;
    }

    setStatus("Alert rule saved. Refresh the page to see it in the active rules list.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Active rules" value={String(summary.active)} />
        <MetricCard label="Email rules" value={String(summary.emailRules)} />
        <MetricCard label="SMS rules" value={String(summary.smsRules)} />
        <MetricCard
          label="Last delivery"
          value={summary.lastDelivery ? new Date(summary.lastDelivery).toLocaleString() : "None yet"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Create Premium Alert Rule</div>
          <p className="mt-2 text-sm text-slate-400">
            Build selective alerts around sport, minimum profit, strategy mode, delivery method, cooldowns, and kickoff windows so notifications stay useful instead of noisy.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Rule title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="High-value football opportunities" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Strategy mode">
              <select value={strategyMode} onChange={(e) => setStrategyMode(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                <option value="profit">Profit only</option>
                <option value="welcome">Welcome only</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>

            <Field label="Minimum profit %">
              <input type="number" step="0.1" min="0" value={minProfitPercent} onChange={(e) => setMinProfitPercent(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Trigger type">
              <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                <option value="new_match">New match above threshold</option>
                <option value="improved_match">Improved match</option>
                <option value="profit_jump">Profit jump</option>
                <option value="bookmaker_match">Preferred bookmaker appears</option>
                <option value="kickoff_window">Kickoff window reached</option>
              </select>
            </Field>

            <Field label="Digest / frequency">
              <select value={digestMode} onChange={(e) => setDigestMode(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                <option value="instant">Instant</option>
                <option value="hourly_digest">Hourly digest</option>
                <option value="six_hour_digest">6-hour digest</option>
                <option value="daily_digest">Daily digest</option>
              </select>
            </Field>

            <Field label="Cooldown minutes">
              <input type="number" min="5" step="5" value={cooldownMinutes} onChange={(e) => setCooldownMinutes(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Kickoff window hours">
              <input type="number" min="0" step="1" value={kickoffWindowHours} onChange={(e) => setKickoffWindowHours(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <Field label="Bookmaker include list">
              <input value={bookmakerInclude} onChange={(e) => setBookmakerInclude(e.target.value)} placeholder="bet365, skybet, paddypower" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
            </Field>

            <div className="md:col-span-2">
              <Field label="Bookmaker exclude list">
                <input value={bookmakerExclude} onChange={(e) => setBookmakerExclude(e.target.value)} placeholder="bookmaker_a, bookmaker_b" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>
            </div>

            <div className="md:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Sport types</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {ALERT_SPORT_OPTIONS.map((sport) => {
                  const active = selectedSports.includes(sport.key);
                  return (
                    <button
                      key={sport.key}
                      type="button"
                      onClick={() => toggleSport(sport.key)}
                      className={`rounded-2xl px-4 py-3 text-sm ${active ? "bg-emerald-500 text-slate-950" : "border border-white/10 bg-slate-950 text-white"}`}
                    >
                      {sport.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
              <Toggle label="In-app alerts" enabled={deliveryInApp} setEnabled={setDeliveryInApp} />
              <Toggle label="Email alerts" enabled={deliveryEmail} setEnabled={setDeliveryEmail} />
              <Toggle label="SMS alerts" enabled={deliverySms} setEnabled={setDeliverySms} />
            </div>
          </div>

          <button type="button" onClick={saveRule} className="mt-5 rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">
            Save Alert Rule
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-lg font-semibold">Contact & Delivery Preferences</div>
            <p className="mt-2 text-sm text-slate-400">
              Your phone number is only used for your own alert delivery. This page scaffolds SMS sending; you can wire Twilio in later using env placeholders.
            </p>

            <div className="mt-5 grid gap-4">
              <Field label="Alert email">
                <input value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>

              <Toggle label="Enable SMS alerts" enabled={smsEnabled} setEnabled={setSmsEnabled} />

              <Field label="Phone number">
                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+447..." className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>

              <Field label="Timezone">
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/London" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
              </Field>

              <Toggle label="Enable quiet hours" enabled={quietHoursEnabled} setEnabled={setQuietHoursEnabled} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Quiet hours start">
                  <input type="time" value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                </Field>
                <Field label="Quiet hours end">
                  <input type="time" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                </Field>
              </div>
            </div>

            <button type="button" onClick={saveContactPreferences} className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100">
              Save Contact Preferences
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-lg font-semibold">Recent Alert Deliveries</div>
            <div className="mt-4 space-y-3">
              {initialDeliveries.length ? (
                initialDeliveries.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-sm font-medium">{row.event_name || "Unnamed event"}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {row.delivery_channel} • {row.delivery_status} • {row.sport_key || "general"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {row.trigger_reason || "No trigger reason recorded"} • {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                  No alerts have fired yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-lg font-semibold">Active Premium Alert Rules</div>
        <div className="mt-4 space-y-3">
          {initialRules.length ? (
            initialRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-sm font-medium">{rule.title}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {rule.enabled ? "Enabled" : "Disabled"} • {rule.strategy_mode || "any"} • minimum profit {rule.min_profit_percent ?? 0}%
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Sports: {rule.sport_keys?.length ? rule.sport_keys.join(", ") : "all"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Delivery: {[
                        rule.delivery_in_app ? "in-app" : null,
                        rule.delivery_email ? "email" : null,
                        rule.delivery_sms ? "sms" : null,
                      ].filter(Boolean).join(", ") || "none"}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Trigger: {rule.trigger_type} • Cooldown: {rule.cooldown_minutes}m • Digest: {rule.digest_mode}
                    <br />
                    Last triggered: {rule.last_triggered_at ? new Date(rule.last_triggered_at).toLocaleString() : "never"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
              No alert rules yet. Start with one or two disciplined rules rather than a flood of weak notifications.
            </div>
          )}
        </div>
      </div>

      {status ? (
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-sm text-cyan-100">
          {status}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function Toggle({
  label,
  enabled,
  setEnabled,
}: {
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={`rounded-2xl border px-4 py-3 text-sm text-left ${
        enabled
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-white/10 bg-slate-950 text-white"
      }`}
    >
      {label}: {enabled ? "On" : "Off"}
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}