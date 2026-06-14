export function PageHeader({
  title,
  subtitle,
  count,
  action,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-950">
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-bold text-brand-700">{count}</span>
          )}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-brand-900/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
