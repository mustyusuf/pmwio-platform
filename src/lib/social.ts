import type { SiteContent } from "@/lib/siteContent";

export type SocialNetwork = "facebook" | "instagram" | "tiktok";
export type SocialLink = { network: SocialNetwork; label: string; url: string; handle: string };

const NETWORKS: { network: SocialNetwork; label: string }[] = [
  { network: "facebook", label: "Facebook" },
  { network: "instagram", label: "Instagram" },
  { network: "tiktok", label: "TikTok" },
];

/** Configured social profiles. A network with a blank URL is hidden sitewide. */
export function socialLinks(sc: SiteContent): SocialLink[] {
  return NETWORKS.flatMap(({ network, label }) => {
    const url = sc.get(`org.social.${network}.url`).trim();
    if (!url) return [];
    const handle = sc.get(`org.social.${network}.handle`).trim();
    return [{ network, label, url, handle: handle || label }];
  });
}
