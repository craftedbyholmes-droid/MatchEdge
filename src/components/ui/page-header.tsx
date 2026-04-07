export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
    </div>
  );
}