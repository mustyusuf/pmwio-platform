export type LegacyGalleryImage = {
  id: string;
  category: "EMPOWERMENT" | "ORPHANAGE" | "SCHOLARSHIP" | "EVENTS";
  caption: string;
  src: string;
  mimeType: string;
};

export const LEGACY_BRAND_IMAGES = [
  {
    id: "legacy-logo",
    label: "Wordmark logo",
    src: "/pmwio-logo.png",
  },
];

export const LEGACY_GALLERY_IMAGES: LegacyGalleryImage[] = [
  {
    id: "empowerment-outreach",
    category: "EMPOWERMENT",
    caption: "Empowerment outreach and support",
    src: "/gallery/empowerment/empowerment-outreach.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "empowerment-outreach-thumbnail",
    category: "EMPOWERMENT",
    caption: "Support delivered to a beneficiary",
    src: "/gallery/empowerment/empowerment-outreach-thumbnail.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "community-event",
    category: "EVENTS",
    caption: "Pious Muslim Women community event",
    src: "/gallery/events/community-event.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "community-gathering",
    category: "EVENTS",
    caption: "Community gathering and outreach",
    src: "/gallery/events/community-gathering.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "orphans-education-appeal",
    category: "ORPHANAGE",
    caption: "Orphans' education appeal",
    src: "/gallery/orphanage/orphans-education-appeal.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "donations-presentation",
    category: "ORPHANAGE",
    caption: "Donations presented to the orphanage",
    src: "/gallery/orphanage/donations-presentation.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "orphanage-support-team",
    category: "ORPHANAGE",
    caption: "Orphanage support team",
    src: "/gallery/orphanage/orphanage-support-team.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "children-support-visit",
    category: "ORPHANAGE",
    caption: "Children receiving supplies during a support visit",
    src: "/gallery/orphanage/children-support-visit.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "orphanage-vehicle",
    category: "ORPHANAGE",
    caption: "Pious Muslim Women orphanage outreach vehicle",
    src: "/gallery/orphanage/orphanage-vehicle.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "school-visit",
    category: "ORPHANAGE",
    caption: "School and orphanage care visit",
    src: "/gallery/orphanage/school-visit.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "children-feeding-programme",
    category: "ORPHANAGE",
    caption: "Children's feeding programme",
    src: "/gallery/orphanage/children-feeding-programme.jpg",
    mimeType: "image/jpeg",
  },
  {
    id: "orphanage-celebration",
    category: "ORPHANAGE",
    caption: "Orphanage celebration and community visit",
    src: "/gallery/orphanage/orphanage-celebration.jpg",
    mimeType: "image/jpeg",
  },
];

export function isLegacyImageSource(value: string) {
  return value.startsWith("/gallery/") || value.startsWith("https://piousmuslimwomen.org.ng/");
}
