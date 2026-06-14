export function MarketingHero({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-crimson-500/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-20">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-crimson-400">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-100">{subtitle}</p>}
      </div>
    </section>
  );
}
