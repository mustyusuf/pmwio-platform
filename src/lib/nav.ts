import { ROLES } from "@/lib/roles";

export type NavChild = { label: string; href: string };
export type NavIcon =
  | "home"
  | "file-text"
  | "users"
  | "user"
  | "user-cog"
  | "image"
  | "award"
  | "hand-heart"
  | "sprout"
  | "wallet"
  | "list"
  | "settings"
  | "file-plus"
  | "bell";
export type NavItem = { label: string; href: string; icon: NavIcon; children?: NavChild[]; disabled?: boolean; badge?: string };

const PROFILE_ITEM: NavItem = { label: "My Profile", href: "/dashboard/profile", icon: "user" };

const BENEFICIARY_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  { label: "My Applications", href: "/dashboard/applications", icon: "file-text" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  PROFILE_ITEM,
];

function memberNav(empowermentOpen: boolean): NavItem[] {
  return [
    { label: "Overview", href: "/dashboard", icon: "home" },
    { label: "My Referrals", href: "/dashboard/applications", icon: "users" },
    {
      label: "Empowerment",
      href: "/dashboard/empowerment",
      icon: "sprout",
      disabled: !empowermentOpen,
      badge: empowermentOpen ? "Open" : "Closed",
    },
    { label: "Monthly Contributions", href: "/dashboard/contributions", icon: "wallet" },
    { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
    PROFILE_ITEM,
  ];
}

const FINANCE_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  { label: "Payments", href: "/dashboard/payments", icon: "wallet" },
  { label: "Donations", href: "/dashboard/donations", icon: "hand-heart" },
  { label: "Applications", href: "/dashboard/applications", icon: "file-text" },
  { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: "hand-heart" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  PROFILE_ITEM,
];

const COORDINATOR_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  { label: "Scholarship Monitoring", href: "/dashboard/scholarships", icon: "award" },
  { label: "Applications", href: "/dashboard/applications", icon: "file-text" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  PROFILE_ITEM,
];

const BENEFICIARIES_CHILDREN: NavChild[] = [
  { label: "All beneficiaries", href: "/dashboard/beneficiaries" },
  { label: "Orphanage", href: "/dashboard/beneficiaries?program=ORPHANAGE" },
  { label: "Scholarship", href: "/dashboard/beneficiaries?program=SCHOLARSHIP" },
  { label: "Empowerment", href: "/dashboard/beneficiaries?program=EMPOWERMENT" },
];

/** Sidebar navigation items for a given role. */
export function navForRole(role: string, opts: { empowermentOpen?: boolean } = {}): NavItem[] {
  if (role === ROLES.BENEFICIARY) return BENEFICIARY_NAV;
  if (role === ROLES.MEMBER) return memberNav(Boolean(opts.empowermentOpen));
  if (role === ROLES.FINANCE) return FINANCE_NAV;
  if (role === ROLES.COORDINATOR) return COORDINATOR_NAV;

  // Staff: Executive, Board, Administrator
  const items: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: "home" },
    { label: "Applications", href: "/dashboard/applications", icon: "file-text" },
    { label: "Members", href: "/dashboard/members", icon: "users" },
    { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: "hand-heart", children: BENEFICIARIES_CHILDREN },
    { label: "Scholarships", href: "/dashboard/scholarships", icon: "award" },
  ];

  if (role === ROLES.EXECUTIVE || role === ROLES.ADMIN) {
    items.push(
      { label: "Payments", href: "/dashboard/payments", icon: "wallet" },
      { label: "Donations", href: "/dashboard/donations", icon: "hand-heart" },
      { label: "Audit Logs", href: "/dashboard/audit", icon: "list" },
      { label: "Users", href: "/dashboard/users", icon: "user-cog" },
      { label: "Form Builder", href: "/dashboard/form-fields", icon: "file-plus" },
      { label: "Gallery", href: "/dashboard/gallery", icon: "image" },
      { label: "Settings", href: "/dashboard/settings", icon: "settings" },
    );
  }
  items.push(PROFILE_ITEM);
  return items;
}
