import Link from "next/link";
import { loadSiteContent } from "@/lib/content-store";

export async function SiteFooter() {
  const sc = await loadSiteContent();
  const name = sc.get("org.name");
  const email = sc.get("org.email");
  const phone = sc.get("org.phone");

  return (
    <footer id="contact" className="mt-auto bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-200">
            {sc.get("org.blurb")}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-300">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/programs" className="hover:text-white">What We Do</Link></li>
            <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>
            <li><Link href="/donate" className="hover:text-white">Donate</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/apply" className="hover:text-white">Apply for a Program</Link></li>
            <li><Link href="/register" className="hover:text-white">Become a Member</Link></li>
            <li><Link href="/login" className="hover:text-white">Member Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-300">
            Get in touch
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </li>
            <li>
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white">
                {phone}
              </a>
            </li>
            <li className="text-brand-200">{sc.get("org.address")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-brand-300 sm:px-6">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
