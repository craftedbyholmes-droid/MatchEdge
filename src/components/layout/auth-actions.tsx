import Link from "next/link";

export function AuthActions({
  effectivePlan,
}: {
  effectivePlan: "free" | "premium" | "pro";
}) {
  const label =
    effectivePlan === "pro"
      ? "Pro"
      : effectivePlan === "premium"
        ? "Premium"
        : "Free";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Effective plan
        </div>
        <div className="mt-2 text-sm font-medium text-white">{label}</div>
      </div>

      <Link
        href="/pricing"
        className="block rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-center text-sm text-white"
      >
        Premium Plans
      </Link>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}