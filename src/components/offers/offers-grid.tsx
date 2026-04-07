import type { OfferRow } from "@/lib/offers";

function formatExpiry(input?: string | null) {
  if (!input) return "No expiry listed";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "No expiry listed";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OffersGrid({
  offers,
}: {
  offers: OfferRow[];
}) {
  const grouped = {
    welcome: offers.filter((offer) => offer.offer_type === "welcome"),
    reload: offers.filter((offer) => offer.offer_type === "reload"),
    bonus: offers.filter((offer) => ["bonus", "free_bet", "cashback", "enhanced_odds", "other"].includes(offer.offer_type)),
  };

  return (
    <div className="space-y-8">
      <OfferSection title="Welcome Offers" offers={grouped.welcome} emptyText="No active welcome offers yet." />
      <OfferSection title="Reload Offers" offers={grouped.reload} emptyText="No active reload offers yet." />
      <OfferSection title="Bonus & Ongoing Value" offers={grouped.bonus} emptyText="No active bonus or ongoing offers yet." />
    </div>
  );
}

function OfferSection({
  title,
  offers,
  emptyText,
}: {
  title: string;
  offers: OfferRow[];
  emptyText: string;
}) {
  return (
    <section className="space-y-4">
      <div className="text-xl font-semibold">{title}</div>

      {offers.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                    {offer.bookmaker_name} • {offer.offer_type.replaceAll("_", " ")}
                  </div>
                  <div className="mt-2 text-xl font-semibold">{offer.headline}</div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Expires: {formatExpiry(offer.expires_at)}
                </div>
              </div>

              {offer.short_description ? (
                <div className="mt-3 text-sm text-slate-300">{offer.short_description}</div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <OfferMetric label="Stake requirement" value={offer.stake_requirement || "Not stated"} />
                <OfferMetric label="Reward" value={offer.reward_value || "Not stated"} />
                <OfferMetric label="Reward type" value={offer.reward_type || "Not stated"} />
                <OfferMetric label="Minimum odds" value={offer.min_odds || "Not stated"} />
              </div>

              {offer.qualifying_instructions ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                  {offer.qualifying_instructions}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={offer.affiliate_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100"
                >
                  Open offer
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function OfferMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}