// Roles, permissions and labels for the role-based system.

export const ROLES = {
  EXECUTIVE: "EXECUTIVE",
  BOARD: "BOARD",
  ADMIN: "ADMIN",
  FINANCE: "FINANCE",
  COORDINATOR: "COORDINATOR",
  MEMBER: "MEMBER",
  BENEFICIARY: "BENEFICIARY",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABEL: Record<string, string> = {
  EXECUTIVE: "Executive",
  BOARD: "Board Member",
  ADMIN: "Administrator",
  FINANCE: "Finance Officer",
  COORDINATOR: "State Coordinator",
  MEMBER: "Member / Referee",
  BENEFICIARY: "Beneficiary",
};

export const ROLE_TAGLINE: Record<string, string> = {
  EXECUTIVE: "Final approving authority",
  BOARD: "Reviews applications before the Executive",
  ADMIN: "Manages daily operations",
  FINANCE: "Enters and processes payments",
  COORDINATOR: "Nominates & monitors scholarship beneficiaries in their state(s)",
  MEMBER: "Refers and vouches for beneficiaries",
  BENEFICIARY: "Applies for support",
};

// Roles a member of the public is allowed to self-register as.
export const PUBLIC_ROLES: Role[] = [ROLES.MEMBER, ROLES.BENEFICIARY];

// Permissions, mapped per role. Used to gate server actions and UI.
export const PERMISSIONS = {
  APPROVE_APPLICATION: "APPROVE_APPLICATION",
  REJECT_APPLICATION: "REJECT_APPLICATION",
  ENTER_PAYMENT: "ENTER_PAYMENT",
  APPROVE_PAYMENT: "APPROVE_PAYMENT",
  GENERATE_REPORTS: "GENERATE_REPORTS",
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  REVIEW_APPLICATION: "REVIEW_APPLICATION",
  RECOMMEND: "RECOMMEND",
  ADD_COMMENT: "ADD_COMMENT",
  REFER_BENEFICIARY: "REFER_BENEFICIARY",
  CONFIRM_REFERRAL: "CONFIRM_REFERRAL",
  SUBMIT_APPLICATION: "SUBMIT_APPLICATION",
  NOMINATE_SCHOLARSHIP: "NOMINATE_SCHOLARSHIP",
  SUBMIT_REPORT: "SUBMIT_REPORT",
  VIEW_ALL: "VIEW_ALL",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  EXECUTIVE: [
    PERMISSIONS.VIEW_ALL,
    PERMISSIONS.APPROVE_APPLICATION,
    PERMISSIONS.REJECT_APPLICATION,
    PERMISSIONS.APPROVE_PAYMENT,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.ADD_COMMENT,
  ],
  BOARD: [
    PERMISSIONS.REVIEW_APPLICATION,
    PERMISSIONS.RECOMMEND,
    PERMISSIONS.APPROVE_PAYMENT,
    PERMISSIONS.ADD_COMMENT,
  ],
  ADMIN: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ALL,
  ],
  FINANCE: [
    PERMISSIONS.ENTER_PAYMENT,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ALL,
  ],
  COORDINATOR: [
    PERMISSIONS.NOMINATE_SCHOLARSHIP,
    PERMISSIONS.CONFIRM_REFERRAL,
    PERMISSIONS.SUBMIT_REPORT,
    PERMISSIONS.RECOMMEND,
  ],
  MEMBER: [
    PERMISSIONS.REFER_BENEFICIARY,
    PERMISSIONS.CONFIRM_REFERRAL,
    PERMISSIONS.RECOMMEND,
  ],
  BENEFICIARY: [PERMISSIONS.SUBMIT_APPLICATION],
};

/** States the organization covers (for State Coordinators). */
export const COVERED_STATES = ["Kwara", "Oyo", "Lagos", "Ogun", "Osun"];

export function parseStates(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function can(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaff(role: string): boolean {
  return (
    role === ROLES.EXECUTIVE ||
    role === ROLES.BOARD ||
    role === ROLES.ADMIN ||
    role === ROLES.FINANCE
  );
}
