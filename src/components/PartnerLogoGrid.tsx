import type { PartnerDTO } from "@/lib/partners";

/** A responsive grid of partner/supporter logo cards, falling back to initials when no logo was uploaded. */
export function PartnerLogoGrid({ items }: { items: PartnerDTO[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => {
        const card = (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name} className="max-h-24 max-w-full object-contain" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{p.initials}</div>
            )}
            <p className="line-clamp-2 text-sm font-semibold text-brand-900/80">{p.name}</p>
          </div>
        );
        return p.url ? (
          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{card}</a>
        ) : (
          <div key={p.id}>{card}</div>
        );
      })}
    </div>
  );
}
