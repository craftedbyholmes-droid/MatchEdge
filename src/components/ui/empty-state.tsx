export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}