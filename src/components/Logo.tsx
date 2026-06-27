import Link from "next/link";

/** The organization logo/wordmark. Served directly (not via next/image) so it
 *  renders reliably in every environment, including standalone/Docker builds. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center">
      <span className={`rounded-md ${light ? "bg-white p-1.5" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pmwio-logo.png"
          alt="Pious Muslim Women International Organization"
          width={600}
          height={305}
          className="h-12 w-auto object-contain"
        />
      </span>
    </Link>
  );
}
