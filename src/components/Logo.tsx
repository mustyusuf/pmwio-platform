import Link from "next/link";
import Image from "next/image";

/** The organization logo/wordmark. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center">
      <span className={`rounded-md ${light ? "bg-white p-1.5" : ""}`}>
        <Image
          src="/pmwio-logo.png"
          alt="Pious Muslim Women International Organization"
          width={75}
          height={49}
          priority
          className="h-12 w-auto object-contain"
        />
      </span>
    </Link>
  );
}
