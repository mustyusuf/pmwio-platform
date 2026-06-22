// Shared content + constants for the Pious Muslim Women International Organization site.

export const ORG = {
  name: "Pious Muslim Women International Organization",
  shortName: "PMWIO",
  tagline: "Together, we can build a world where every woman and child can thrive.",
  blurb:
    "A registered Islamic non-governmental organization dedicated to uplifting and supporting vulnerable groups, with members across Nigeria, Ghana, Europe and America.",
  email: "info@piousmuslimwomen.org",
  phone: "+234 800 000 0000",
};

export type ProgramKey = "EMPOWERMENT" | "ORPHANAGE" | "SCHOLARSHIP";

export const PROGRAMS: {
  key: ProgramKey;
  title: string;
  short: string;
  description: string;
}[] = [
  {
    key: "EMPOWERMENT",
    title: "Empowerment",
    short: "Skills, startup capital & support for women.",
    description:
      "We equip women with vocational skills, mentorship and startup capital so they can build sustainable livelihoods and lift their families out of poverty.",
  },
  {
    key: "ORPHANAGE",
    title: "Orphanage Care",
    short: "Love, shelter and care for orphaned children.",
    description:
      "We find, fund and provide loving care, shelter, nutrition and healthcare for orphaned and vulnerable children — because every child deserves the chance to thrive.",
  },
  {
    key: "SCHOLARSHIP",
    title: "Scholarships",
    short: "Education for brilliant & needy public-school students.",
    description:
      "We fund tuition, books and learning materials for brilliant but financially-disadvantaged students in public schools, opening the door to a brighter future.",
  },
];

export const IMPACT_STATS = [
  { value: "1,200+", label: "Members worldwide" },
  { value: "350+", label: "Widows empowered" },
  { value: "500+", label: "Students on scholarship" },
  { value: "40+", label: "Orphans cared for" },
];

export const PROGRAM_LABEL: Record<string, string> = {
  EMPOWERMENT: "Empowerment",
  ORPHANAGE: "Orphanage Care",
  SCHOLARSHIP: "Scholarship",
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

// Programs the public can apply for. Empowerment is members-only and is
// applied for from the member dashboard (when the window is open).
export const PUBLIC_PROGRAMS = PROGRAMS.filter((p) => p.key !== "EMPOWERMENT");

// Human labels for the keys stored in Application.formData (JSON).
export const FIELD_LABEL: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  guardianName: "Guardian / parent name",
  guardianRelationship: "Guardian relationship",
  guardianPhone: "Guardian phone",
  nin: "NIN",
  address: "Residential address",
  contactPhone: "Contact phone",
  schoolName: "School name",
  schoolClass: "Class / level",
  academicYear: "Academic year",
  // Scholarship (extended)
  state: "State",
  term: "Term applying for",
  schoolType: "School type",
  schoolOwnership: "School ownership",
  studentCategory: "Student category",
  // Orphanage (extended)
  classType: "Class type",
  need: "Type of need",
  // Empowerment
  purpose: "Purpose of application",
  desiredAmount: "Desired amount",
  coverLetter: "Cover letter",
  whyNeeded: "Why you need the empowerment",
  sustainabilityPlan: "Sustainability plan",
};

// ---- Scholarship option sets ----
export const SCHOLARSHIP_STATES = ["Kwara", "Oyo", "Lagos", "Ogun", "Osun"];
export const SCHOOL_TYPES = ["Primary", "Secondary"];
export const SCHOOL_OWNERSHIP = ["Public", "Federal", "State"]; // private not eligible
export const STUDENT_CATEGORIES = ["Needy", "Brilliant"];
/** Maximum award for a scholarship beneficiary. */
export const SCHOLARSHIP_MAX_AWARD = 50000;

// ---- Orphanage option sets ----
export const ORPHANAGE_CLASS_TYPES = ["Primary", "Secondary", "Tertiary"];
export const ORPHANAGE_NEEDS = ["Clothing", "Health", "Feeding", "Tuition", "Stipends"];

// Field types supported by the admin form builder.
export const CUSTOM_FIELD_TYPES = ["text", "textarea", "number", "select"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

// ---- Landing-page gallery ----
export const GALLERY_CATEGORIES = [
  { key: "EMPOWERMENT", label: "Empowerment" },
  { key: "ORPHANAGE", label: "Orphanage" },
  { key: "SCHOLARSHIP", label: "Scholarship" },
  { key: "EVENTS", label: "Events" },
];

export type GalleryItem = { id: string; category: string; caption: string; seed: string };

export const GALLERY: GalleryItem[] = [
  { id: "g1", category: "EMPOWERMENT", caption: "Tailoring skills workshop", seed: "pmw-emp-1" },
  { id: "g2", category: "EMPOWERMENT", caption: "Startup capital handover", seed: "pmw-emp-2" },
  { id: "g3", category: "EMPOWERMENT", caption: "Women's cooperative meeting", seed: "pmw-emp-3" },
  { id: "g4", category: "ORPHANAGE", caption: "Orphan care home visit", seed: "pmw-orp-1" },
  { id: "g5", category: "ORPHANAGE", caption: "Feeding programme", seed: "pmw-orp-2" },
  { id: "g6", category: "ORPHANAGE", caption: "Clothing distribution", seed: "pmw-orp-3" },
  { id: "g7", category: "SCHOLARSHIP", caption: "Scholarship award ceremony", seed: "pmw-sch-1" },
  { id: "g8", category: "SCHOLARSHIP", caption: "Back-to-school supplies", seed: "pmw-sch-2" },
  { id: "g9", category: "SCHOLARSHIP", caption: "Students in the classroom", seed: "pmw-sch-3" },
  { id: "g10", category: "EVENTS", caption: "Annual general meeting", seed: "pmw-evt-1" },
  { id: "g11", category: "EVENTS", caption: "Community outreach day", seed: "pmw-evt-2" },
  { id: "g12", category: "EVENTS", caption: "Ramadan food drive", seed: "pmw-evt-3" },
];
