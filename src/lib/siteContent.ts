import { ORG, PROGRAMS } from "@/lib/content";

export type ContentFieldType = "text" | "textarea" | "image";

const STAT_LABEL_HELP = "The number above this label is counted live from the system and can't be edited.";

export type ContentField = {
  key: string;
  label: string;
  type: ContentFieldType;
  section: string;
  default: string; // for images, an optional fallback path under /public
  help?: string;
};

/**
 * The registry of admin-editable site content. Add a field here and it
 * automatically appears in the admin editor and is readable via getContent().
 */
export const CONTENT_FIELDS: ContentField[] = [
  // ----- Organization (used in header, footer, contact, hero) -----
  { key: "org.name", label: "Organization name", type: "text", section: "Organization", default: ORG.name },
  { key: "org.tagline", label: "Tagline", type: "text", section: "Organization", default: ORG.tagline },
  { key: "org.blurb", label: "Short description", type: "textarea", section: "Organization", default: ORG.blurb },
  { key: "org.email", label: "Contact email", type: "text", section: "Organization", default: ORG.email },
  { key: "org.phone", label: "Contact phone", type: "text", section: "Organization", default: ORG.phone },
  { key: "org.address", label: "Address / location", type: "text", section: "Organization", default: "Abuja, Nigeria" },

  // ----- Social media (header icons + contact page handles) -----
  // Leave a URL blank to hide that network everywhere on the site.
  { key: "org.social.facebook.url", label: "Facebook link", type: "text", section: "Social media", default: "https://facebook.com/share/p/1DEDvHQwxQ/?mibextid=wwXIfr&ref=1" },
  { key: "org.social.facebook.handle", label: "Facebook username", type: "text", section: "Social media", default: "Pious Muslim Women", help: "Shown next to the icon on the contact page." },
  { key: "org.social.instagram.url", label: "Instagram link", type: "text", section: "Social media", default: "https://www.instagram.com/piousmuslimwomenorg" },
  { key: "org.social.instagram.handle", label: "Instagram username", type: "text", section: "Social media", default: "@piousmuslimwomenorg" },
  { key: "org.social.tiktok.url", label: "TikTok link", type: "text", section: "Social media", default: "https://www.tiktok.com/@pious_muslimwomen1" },
  { key: "org.social.tiktok.handle", label: "TikTok username", type: "text", section: "Social media", default: "@pious_muslimwomen1" },

  // ----- About — Management team (cards are managed under Dashboard → Management team) -----
  { key: "about.team.eyebrow", label: "Team eyebrow", type: "text", section: "About — Management team", default: "Our people" },
  { key: "about.team.title", label: "Team heading", type: "text", section: "About — Management team", default: "Meet our management team" },
  { key: "about.team.subtitle", label: "Team intro", type: "textarea", section: "About — Management team", default: "The people leading our work and holding us accountable to the communities we serve." },

  // ----- Home — Hero -----
  { key: "home.hero.badge", label: "Hero badge", type: "text", section: "Home — Hero", default: "A global Islamic NGO · Members across 4 continents" },
  { key: "home.hero.heading", label: "Hero heading", type: "text", section: "Home — Hero", default: "Pious Muslim Women" },
  { key: "home.hero.highlight", label: "Hero heading (highlighted part)", type: "text", section: "Home — Hero", default: "International Organization" },
  { key: "home.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Home — Hero", default: ORG.blurb },
  { key: "home.hero.image", label: "Hero background image", type: "image", section: "Home — Hero", default: "", help: "Optional. Adds a faded photo behind the hero." },

  // ----- Home — Impact stats -----
  // The numbers themselves are always computed live (see lib/stats.ts) — only
  // the wording underneath each one is editable, so a stat can never go stale.
  { key: "impact.1.label", label: "Stat 1 — label (members)", type: "text", section: "Home — Impact stats", default: "Members worldwide", help: STAT_LABEL_HELP },
  { key: "impact.2.label", label: "Stat 2 — label (empowerment)", type: "text", section: "Home — Impact stats", default: "Widows empowered", help: STAT_LABEL_HELP },
  { key: "impact.3.label", label: "Stat 3 — label (scholarship)", type: "text", section: "Home — Impact stats", default: "Students on scholarship", help: STAT_LABEL_HELP },
  { key: "impact.4.label", label: "Stat 4 — label (orphanage)", type: "text", section: "Home — Impact stats", default: "Orphans cared for", help: STAT_LABEL_HELP },

  // ----- About page -----
  { key: "about.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "About page", default: "About us" },
  { key: "about.hero.title", label: "Hero heading", type: "text", section: "About page", default: "Faith in action, across the world." },
  { key: "about.mission.title", label: "Mission heading", type: "text", section: "About page", default: "Our mission" },
  { key: "about.mission.p1", label: "Mission paragraph 1", type: "textarea", section: "About page", default: "The Pious Muslim Women International Organization is a registered Islamic non-governmental organization dedicated to uplifting and supporting vulnerable groups. With members across Nigeria, Ghana, Europe and America, we unite women of faith to care for orphans, empower widows, and open the doors of education to brilliant but needy students." },
  { key: "about.mission.p2", label: "Mission paragraph 2", type: "textarea", section: "About page", default: "We believe that lasting change begins with dignity — meeting immediate needs while investing in the skills, education and opportunity that help families stand on their own." },
  { key: "about.quote", label: "Founder quote", type: "textarea", section: "About page", default: "At Pious Muslim Women Organization, we believe every child deserves love, care, and the opportunity to thrive — regardless of their circumstances." },
  { key: "about.founder", label: "Founder name / title", type: "text", section: "About page", default: "Prof. H. T. Yusuf, Founder" },

  // ----- Programs (titles & descriptions — shared by home + programs page) -----
  ...PROGRAMS.flatMap((p) => {
    const k = p.key.toLowerCase();
    return [
      { key: `program.${k}.title`, label: `${p.title} — title`, type: "text", section: "Programs — titles & descriptions", default: p.title } as ContentField,
      { key: `program.${k}.description`, label: `${p.title} — description`, type: "textarea", section: "Programs — titles & descriptions", default: p.description } as ContentField,
    ];
  }),

  // ----- Home — Who we are section -----
  { key: "home.about.eyebrow", label: "Eyebrow", type: "text", section: "Home — Who we are", default: "Who we are" },
  { key: "home.about.title", label: "Heading", type: "text", section: "Home — Who we are", default: "Faith in action, across the world." },
  { key: "home.about.text", label: "Paragraph", type: "textarea", section: "Home — Who we are", default: "Pious Muslim Women International Organization unites women of faith to care for the vulnerable. Guided by compassion and rooted in our values, we find and fund those in need, provide care, educate the next generation, and empower women to stand on their own." },
  { key: "home.about.quote", label: "Quote", type: "textarea", section: "Home — Who we are", default: "We believe every child deserves love, care, and the opportunity to thrive — regardless of their circumstances." },
  { key: "home.about.founder", label: "Quote attribution", type: "text", section: "Home — Who we are", default: "Prof. H. T. Yusuf, Founder" },
  { key: "home.about.card1.title", label: "Card 1 — title", type: "text", section: "Home — Who we are", default: "Find & Fund" },
  { key: "home.about.card1.desc", label: "Card 1 — text", type: "text", section: "Home — Who we are", default: "We locate the most vulnerable and raise the resources to help." },
  { key: "home.about.card2.title", label: "Card 2 — title", type: "text", section: "Home — Who we are", default: "Provide Care" },
  { key: "home.about.card2.desc", label: "Card 2 — text", type: "text", section: "Home — Who we are", default: "Shelter, nutrition and healthcare for orphans and widows." },
  { key: "home.about.card3.title", label: "Card 3 — title", type: "text", section: "Home — Who we are", default: "We Educate" },
  { key: "home.about.card3.desc", label: "Card 3 — text", type: "text", section: "Home — Who we are", default: "Scholarships and learning materials for needy students." },
  { key: "home.about.card4.title", label: "Card 4 — title", type: "text", section: "Home — Who we are", default: "We Empower" },
  { key: "home.about.card4.desc", label: "Card 4 — text", type: "text", section: "Home — Who we are", default: "Skills and capital so women can build a future." },

  // ----- Home — Programs section -----
  { key: "home.programs.eyebrow", label: "Eyebrow", type: "text", section: "Home — Programs section", default: "What we do" },
  { key: "home.programs.title", label: "Heading", type: "text", section: "Home — Programs section", default: "Three ways we change lives" },
  { key: "home.programs.intro", label: "Intro", type: "textarea", section: "Home — Programs section", default: "Every program is open for applications from the public — anyone in need can reach out for support." },

  // ----- Home — Partners & Supporters -----
  { key: "home.partners.eyebrow", label: "Eyebrow", type: "text", section: "Home — Partners & Supporters", default: "Working together" },
  { key: "home.partners.title", label: "Heading", type: "text", section: "Home — Partners & Supporters", default: "Our Partners & Supporters" },
  { key: "home.partners.subtitle", label: "Subtitle", type: "textarea", section: "Home — Partners & Supporters", default: "The organizations who work alongside us and support our mission." },

  // ----- Home — Donation section -----
  { key: "home.donate.eyebrow", label: "Eyebrow", type: "text", section: "Home — Donation section", default: "Support our mission" },
  { key: "home.donate.title", label: "Heading", type: "text", section: "Home — Donation section", default: "Turn compassion into practical support." },
  { key: "home.donate.text", label: "Text", type: "textarea", section: "Home — Donation section", default: "Your donation helps provide food, healthcare, education and sustainable livelihood support. Give once, support a current appeal, or contribute monthly as a member." },
  { key: "home.donate.cardTitle", label: "Card title", type: "text", section: "Home — Donation section", default: "Every contribution matters" },
  { key: "home.donate.cardText", label: "Card text", type: "textarea", section: "Home — Donation section", default: "Choose a general donation or direct your gift to one of our active event and fundraising campaigns." },

  // ----- Home — Member & Apply CTAs -----
  { key: "home.member.title", label: "Member CTA — heading", type: "text", section: "Home — Member & Apply CTAs", default: "Join a global sisterhood of changemakers" },
  { key: "home.member.text", label: "Member CTA — text", type: "textarea", section: "Home — Member & Apply CTAs", default: "Register as a member to get your own dashboard and a unique User ID (your Referee ID). Applicants name you as their referee when they apply — so you can track the people you bring into the cause." },
  { key: "home.apply.title", label: "Apply CTA — heading", type: "text", section: "Home — Member & Apply CTAs", default: "Need support? You don't have to be a member to apply." },
  { key: "home.apply.text", label: "Apply CTA — text", type: "textarea", section: "Home — Member & Apply CTAs", default: "Whether you're seeking empowerment, care for an orphan, or a scholarship for a brilliant student, our application takes just a few minutes. You'll need a member's Referee ID to apply." },

  // ----- Programs page -----
  { key: "programs.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Programs page", default: "What we do" },
  { key: "programs.hero.title", label: "Hero heading", type: "text", section: "Programs page", default: "Three ways we change lives." },
  { key: "programs.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Programs page", default: "From empowering women to caring for orphans and funding education, every program is designed to restore dignity and open opportunity." },
  { key: "program.empowerment.eligibility", label: "Empowerment — who can apply (one per line)", type: "textarea", section: "Programs page", default: "Open to registered members of the organization\nA clear purpose and a workable business or livelihood plan\nCommitment to a sustainability plan" },
  { key: "program.empowerment.how", label: "Empowerment — how it works", type: "textarea", section: "Programs page", default: "Members apply from their dashboard when the empowerment window is open. Provide your purpose, desired amount, cover letter, why you need support, and a sustainability plan." },
  { key: "program.orphanage.eligibility", label: "Orphanage — who can apply (one per line)", type: "textarea", section: "Programs page", default: "Orphaned or vulnerable children and their guardians\nReferred and vouched for by a member\nDemonstrated need (clothing, health, feeding, tuition or stipends)" },
  { key: "program.orphanage.how", label: "Orphanage — how it works", type: "textarea", section: "Programs page", default: "Apply online with the child's and guardian's details, the type of need, and supporting documents. A member must confirm the referral before review." },
  { key: "program.scholarship.eligibility", label: "Scholarship — who can apply (one per line)", type: "textarea", section: "Programs page", default: "Brilliant or needy students in public, federal or state schools (no private schools)\nPrimary or secondary level, in our covered states\nReferred and vouched for by a member" },
  { key: "program.scholarship.how", label: "Scholarship — how it works", type: "textarea", section: "Programs page", default: "Apply online with the student's details, school information and category (needy or brilliant). Awards are capped at ₦50,000. A member must confirm the referral before review." },
  { key: "programs.cta.title", label: "CTA heading", type: "text", section: "Programs page", default: "Need support, or want to help?" },
  { key: "programs.cta.text", label: "CTA text", type: "textarea", section: "Programs page", default: "Apply for a program, or join as a member to refer and support those in need." },

  // ----- About page — How we do it & values -----
  { key: "about.how.eyebrow", label: "How-we-do-it eyebrow", type: "text", section: "About — approach & values", default: "How we do it" },
  { key: "about.how.title", label: "How-we-do-it heading", type: "text", section: "About — approach & values", default: "Our approach" },
  { key: "about.approach1.title", label: "Approach 1 — title", type: "text", section: "About — approach & values", default: "Find & Fund" },
  { key: "about.approach1.desc", label: "Approach 1 — text", type: "textarea", section: "About — approach & values", default: "We identify the most vulnerable women and children in our communities and mobilise the resources needed to support them." },
  { key: "about.approach2.title", label: "Approach 2 — title", type: "text", section: "About — approach & values", default: "Provide Care" },
  { key: "about.approach2.desc", label: "Approach 2 — text", type: "textarea", section: "About — approach & values", default: "We deliver shelter, nutrition, clothing and healthcare to orphans and widows, restoring dignity and hope." },
  { key: "about.approach3.title", label: "Approach 3 — title", type: "text", section: "About — approach & values", default: "We Educate" },
  { key: "about.approach3.desc", label: "Approach 3 — text", type: "textarea", section: "About — approach & values", default: "We fund tuition, books and materials so brilliant, needy students can stay in school and thrive." },
  { key: "about.approach4.title", label: "Approach 4 — title", type: "text", section: "About — approach & values", default: "We Empower" },
  { key: "about.approach4.desc", label: "Approach 4 — text", type: "textarea", section: "About — approach & values", default: "We equip women with vocational skills, mentorship and startup capital to build sustainable livelihoods." },
  { key: "about.values.title", label: "Values heading", type: "text", section: "About — approach & values", default: "Our values" },
  { key: "about.value1.title", label: "Value 1 — title", type: "text", section: "About — approach & values", default: "Compassion" },
  { key: "about.value1.desc", label: "Value 1 — text", type: "text", section: "About — approach & values", default: "Every action is rooted in mercy and genuine care for those we serve." },
  { key: "about.value2.title", label: "Value 2 — title", type: "text", section: "About — approach & values", default: "Integrity" },
  { key: "about.value2.desc", label: "Value 2 — text", type: "text", section: "About — approach & values", default: "We are transparent and accountable with every donation and decision." },
  { key: "about.value3.title", label: "Value 3 — title", type: "text", section: "About — approach & values", default: "Faith" },
  { key: "about.value3.desc", label: "Value 3 — text", type: "text", section: "About — approach & values", default: "Our work is an expression of our values — service to humanity as worship." },
  { key: "about.value4.title", label: "Value 4 — title", type: "text", section: "About — approach & values", default: "Excellence" },
  { key: "about.value4.desc", label: "Value 4 — text", type: "text", section: "About — approach & values", default: "We hold ourselves to the highest standards in everything we do." },
  { key: "about.cta.title", label: "CTA heading", type: "text", section: "About — approach & values", default: "Join us in building a kinder world" },

  // ----- Gallery page -----
  { key: "gallery.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Gallery page", default: "Gallery" },
  { key: "gallery.hero.title", label: "Hero heading", type: "text", section: "Gallery page", default: "Moments from our work." },
  { key: "gallery.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Gallery page", default: "A glimpse of the lives we touch — filter by program to see more." },

  // ----- Archive page -----
  { key: "archive.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Archive page", default: "Archive" },
  { key: "archive.hero.title", label: "Hero heading", type: "text", section: "Archive page", default: "Past lectures, sermons and events." },
  { key: "archive.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Archive page", default: "A record of our lectures, sermons and past events — filter by category to browse." },

  // ----- Contact page -----
  { key: "contact.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Contact page", default: "Contact" },
  { key: "contact.hero.title", label: "Hero heading", type: "text", section: "Contact page", default: "Get in touch." },
  { key: "contact.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Contact page", default: "Whether you'd like to partner, volunteer, donate or ask a question, we'd love to hear from you." },
  { key: "contact.form.title", label: "Form heading", type: "text", section: "Contact page", default: "Send us a message" },
  { key: "contact.member.note", label: "Member note", type: "textarea", section: "Contact page", default: "Are you a member? Log in to your dashboard to manage referrals, applications and more." },

  // ----- Donate page -----
  { key: "donate.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Donate page", default: "Give" },
  { key: "donate.hero.title", label: "Hero heading", type: "text", section: "Donate page", default: "Your donation creates lasting change." },
  { key: "donate.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Donate page", default: "Support orphaned children, deserving students and women building sustainable livelihoods." },
  { key: "donate.general.title", label: "General donation — heading", type: "text", section: "Donate page", default: "Make a general donation" },
  { key: "donate.general.text", label: "General donation — text", type: "textarea", section: "Donate page", default: "Unrestricted donations help PMWIO direct support where it is needed most across all our programmes." },
  { key: "donate.appeals.eyebrow", label: "Appeals eyebrow", type: "text", section: "Donate page", default: "Current appeals" },
  { key: "donate.appeals.title", label: "Appeals heading", type: "text", section: "Donate page", default: "Donate to a specific cause" },

  // ----- Orphanage / Sponsorship (Kafala) page -----
  { key: "orphanage.hero.eyebrow", label: "Hero eyebrow", type: "text", section: "Orphanage page", default: "Kafala — Orphan Sponsorship" },
  { key: "orphanage.hero.title", label: "Hero heading", type: "text", section: "Orphanage page", default: "Sponsor an Orphan Today: Share the Blessing of Kafala" },
  { key: "orphanage.hero.subtitle", label: "Hero subtitle", type: "textarea", section: "Orphanage page", default: "Follow the Sunnah of caring for orphans (yatama) and provide a child with education, shelter, healthcare and spiritual growth." },
  { key: "orphanage.hadith", label: "Hadith callout", type: "textarea", section: "Orphanage page", default: "“I and the person who looks after an orphan will be in Paradise like this,” putting his index and middle fingers together." },
  { key: "orphanage.hadith.source", label: "Hadith source", type: "text", section: "Orphanage page", default: "Sahih al-Bukhari" },

  { key: "orphanage.principle.title", label: "Islamic principle — heading", type: "text", section: "Orphanage page", default: "What Kafala Means" },
  { key: "orphanage.principle.text", label: "Islamic principle — text", type: "textarea", section: "Orphanage page", default: "Kafala is the Islamic tradition of sponsoring and caring for an orphan — providing holistic guardianship, upbringing (tarbiyah) and support — without changing the child's lineage or identity. It is one of the most beloved acts of worship, drawing the sponsor and the child close together, as promised in the Sunnah." },

  { key: "orphanage.cover1.title", label: "Coverage 1 — title", type: "text", section: "Orphanage page", default: "Nutritious Meals & Clean Water" },
  { key: "orphanage.cover1.desc", label: "Coverage 1 — text", type: "textarea", section: "Orphanage page", default: "A healthy daily diet tailored for physical growth." },
  { key: "orphanage.cover2.title", label: "Coverage 2 — title", type: "text", section: "Orphanage page", default: "Secular & Religious Education" },
  { key: "orphanage.cover2.desc", label: "Coverage 2 — text", type: "textarea", section: "Orphanage page", default: "School tuition, books, uniforms and Qur'an / Hifz classes." },
  { key: "orphanage.cover3.title", label: "Coverage 3 — title", type: "text", section: "Orphanage page", default: "Healthcare & Wellbeing" },
  { key: "orphanage.cover3.desc", label: "Coverage 3 — text", type: "textarea", section: "Orphanage page", default: "Medical checkups, immunizations and counseling support." },
  { key: "orphanage.cover4.title", label: "Coverage 4 — title", type: "text", section: "Orphanage page", default: "Safe Housing & Clothing" },
  { key: "orphanage.cover4.desc", label: "Coverage 4 — text", type: "textarea", section: "Orphanage page", default: "Comfortable living spaces and seasonal clothing." },

  { key: "orphanage.tiers.title", label: "Tiers — heading", type: "text", section: "Orphanage page", default: "Sponsorship Pricing Tiers" },
  { key: "orphanage.tier1.name", label: "Tier 1 — name", type: "text", section: "Orphanage page", default: "Partial Care Partner" },
  { key: "orphanage.tier1.price", label: "Tier 1 — price", type: "text", section: "Orphanage page", default: "$35 / month ($420 / year)" },
  { key: "orphanage.tier1.scope", label: "Tier 1 — scope of coverage", type: "textarea", section: "Orphanage page", default: "Co-sponsorship covering food, basic health checkups and school supplies." },
  { key: "orphanage.tier1.benefits", label: "Tier 1 — benefits (one per line)", type: "textarea", section: "Orphanage page", default: "Shared annual progress report\nInclusion in collective du'a lists" },
  { key: "orphanage.tier2.name", label: "Tier 2 — name", type: "text", section: "Orphanage page", default: "Full Orphan Sponsorship" },
  { key: "orphanage.tier2.price", label: "Tier 2 — price", type: "text", section: "Orphanage page", default: "$70 / month ($840 / year)" },
  { key: "orphanage.tier2.scope", label: "Tier 2 — scope of coverage", type: "textarea", section: "Orphanage page", default: "Complete individual coverage: housing, education, meals, clothing and healthcare." },
  { key: "orphanage.tier2.benefits", label: "Tier 2 — benefits (one per line)", type: "textarea", section: "Orphanage page", default: "Dedicated annual progress report\nPersonalized thank-you note or drawing from the child" },
  { key: "orphanage.tier3.name", label: "Tier 3 — name", type: "text", section: "Orphanage page", default: "Comprehensive Care + Hifz" },
  { key: "orphanage.tier3.price", label: "Tier 3 — price", type: "text", section: "Orphanage page", default: "$100 / month ($1,200 / year)" },
  { key: "orphanage.tier3.scope", label: "Tier 3 — scope of coverage", type: "textarea", section: "Orphanage page", default: "Full orphan care plus specialized Qur'an memorization (Hifz) instruction and a higher-education savings fund." },
  { key: "orphanage.tier3.benefits", label: "Tier 3 — benefits (one per line)", type: "textarea", section: "Orphanage page", default: "Full academic & Hifz progress reports\nBi-annual update on the child's Qur'anic milestones" },
  { key: "orphanage.tiers.note", label: "Tiers — footnote", type: "textarea", section: "Orphanage page", default: "Amounts shown are suggested — donate the Naira equivalent, as a one-time annual gift or a recurring monthly contribution." },

  { key: "orphanage.process.title", label: "Process — heading", type: "text", section: "Orphanage page", default: "How the Sponsorship Process Works" },
  { key: "orphanage.process.steps", label: "Process — steps (one per line)", type: "textarea", section: "Orphanage page", default: "Choose your sponsorship level\nSelect a payment frequency (monthly or annual)\nReceive a welcome pack & child profile\nReceive regular updates & annual progress reports" },

  { key: "orphanage.policy.title", label: "Policy — heading", type: "text", section: "Orphanage page", default: "Sponsor Update & Communication Policy" },
  { key: "orphanage.policy.text", label: "Policy — text", type: "textarea", section: "Orphanage page", default: "To protect every child's dignity, safety and privacy while keeping sponsors informed: an annual progress report (academic report card, health summary and a recent photo) is delivered every 12 months; hand-written Eid cards or drawings are sent twice a year. Direct, unmonitored contact with a sponsored child (phone, social media or personal email) is not permitted, cash gifts to individual children are not accepted, and in-person visits must be pre-approved at least 30 days in advance." },

  { key: "orphanage.faq.title", label: "FAQ — heading", type: "text", section: "Orphanage page", default: "Frequently Asked Questions" },
  { key: "orphanage.faq1.q", label: "FAQ 1 — question", type: "text", section: "Orphanage page", default: "Is Orphan Sponsorship eligible for Zakat?" },
  { key: "orphanage.faq1.a", label: "FAQ 1 — answer", type: "textarea", section: "Orphanage page", default: "Yes. Sponsorship funds go directly to poor, needy orphans who fit the eligible Zakat categories (al-Fuqara and al-Masakin)." },
  { key: "orphanage.faq2.q", label: "FAQ 2 — question", type: "text", section: "Orphanage page", default: "How long does a sponsorship last?" },
  { key: "orphanage.faq2.a", label: "FAQ 2 — answer", type: "textarea", section: "Orphanage page", default: "Sponsorship continues until the youth completes secondary school or higher education / vocational training, typically between ages 18 and 21." },
  { key: "orphanage.faq3.q", label: "FAQ 3 — question", type: "text", section: "Orphanage page", default: "What happens if I need to cancel my sponsorship?" },
  { key: "orphanage.faq3.a", label: "FAQ 3 — answer", type: "textarea", section: "Orphanage page", default: "You can pause or cancel at any time. We draw from our reserve fund to ensure uninterrupted care for the child while a new sponsor is assigned." },

  { key: "orphanage.partners.eyebrow", label: "Partners — eyebrow", type: "text", section: "Orphanage page", default: "Working together" },
  { key: "orphanage.partners.title", label: "Partners — heading", type: "text", section: "Orphanage page", default: "Our Partners" },
  { key: "orphanage.partners.subtitle", label: "Partners — subtitle", type: "textarea", section: "Orphanage page", default: "Organizations we work alongside to care for the children in our orphanage program." },
  { key: "orphanage.supporters.eyebrow", label: "Supporters — eyebrow", type: "text", section: "Orphanage page", default: "With gratitude" },
  { key: "orphanage.supporters.title", label: "Supporters — heading", type: "text", section: "Orphanage page", default: "Supported By" },
  { key: "orphanage.supporters.subtitle", label: "Supporters — subtitle", type: "textarea", section: "Orphanage page", default: "The organizations and donors whose generosity sustains this program." },

  { key: "orphanage.cta.title", label: "Closing CTA — heading", type: "text", section: "Orphanage page", default: "Invest in your Akhirah today and change a child's life forever." },
];

const DEFAULTS = new Map(CONTENT_FIELDS.map((f) => [f.key, f.default]));

export function contentDefault(key: string): string {
  return DEFAULTS.get(key) ?? "";
}

export const CONTENT_SECTIONS = [...new Set(CONTENT_FIELDS.map((f) => f.section))];

/** A resolved view of site content: DB overrides merged over registry defaults. */
export class SiteContent {
  constructor(private readonly overrides: Map<string, { value: string; type: string }>) {}

  /** Text value for a key (falls back to the registry default). */
  get(key: string): string {
    return this.overrides.get(key)?.value ?? contentDefault(key);
  }

  /** Public URL for an uploaded image key, or null if none uploaded. */
  image(key: string): string | null {
    const o = this.overrides.get(key);
    if (o?.type === "image" && o.value) return `/api/content/${encodeURIComponent(key)}`;
    return null;
  }
}
