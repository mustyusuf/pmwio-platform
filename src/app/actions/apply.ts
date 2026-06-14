"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword, generateReference } from "@/lib/auth";
import { uniqueUserId } from "@/app/actions/auth";
import { ROLES, parseStates } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";

export type ApplyState =
  | { ok: true; reference: string; userId?: string; createdAccount: boolean }
  | { ok: false; error: string }
  | null;

export type ValidateRefereeResult =
  | { ok: true; refereeId: string; name: string; states?: string[] }
  | { ok: false; error: string };

/**
 * Validates the referee for an application. Scholarships must be nominated by a
 * **State Coordinator** (and we return the states they cover); other programs
 * are referred by a Member.
 */
export async function validateReferee(rawRefereeId: string, category?: string): Promise<ValidateRefereeResult> {
  const refereeId = rawRefereeId.trim().toUpperCase();
  if (!refereeId) return { ok: false, error: "Please enter a Referee ID." };

  const isScholarship = category === "SCHOLARSHIP";
  const role = isScholarship ? ROLES.COORDINATOR : ROLES.MEMBER;
  const user = await prisma.user.findFirst({
    where: { userId: refereeId, role, approved: true, active: true },
    select: { name: true, userId: true, states: true },
  });
  if (!user) {
    return {
      ok: false,
      error: isScholarship
        ? "That State Coordinator ID was not found. Scholarships must be nominated by a coordinator."
        : "That Referee ID was not found. Please check it and try again.",
    };
  }
  return { ok: true, refereeId: user.userId, name: user.name, states: isScholarship ? parseStates(user.states) : undefined };
}

const applySchema = z
  .object({
    category: z.enum(["ORPHANAGE", "SCHOLARSHIP"], { message: "Please choose a program to apply for." }),
    firstName: z.string().trim().min(1, "Enter the applicant's first name."),
    lastName: z.string().trim().min(1, "Enter the applicant's last name."),
    email: z.email("Enter a valid email address.").toLowerCase(),
    contactPhone: z.string().trim().optional(),
    country: z.string().trim().optional(),
    address: z.string().trim().optional(),
    guardianName: z.string().trim().optional(),
    guardianRelationship: z.string().trim().optional(),
    guardianPhone: z.string().trim().optional(),
    nin: z.string().trim().optional(),
    schoolName: z.string().trim().optional(),
    schoolClass: z.string().trim().optional(),
    academicYear: z.string().trim().optional(),
    // Scholarship-specific
    state: z.string().trim().optional(),
    term: z.string().trim().optional(),
    schoolType: z.string().trim().optional(),
    schoolOwnership: z.string().trim().optional(),
    studentCategory: z.string().trim().optional(),
    // Orphanage-specific
    classType: z.string().trim().optional(),
    need: z.string().trim().optional(),
    details: z.string().trim().min(10, "Please tell us a little more (at least 10 characters)."),
    refereeId: z.string().trim().min(1, "A valid Referee ID is required to apply."),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const raw: Record<string, unknown> = {};
  for (const key of [
    "category", "firstName", "lastName", "email", "contactPhone", "country", "address",
    "guardianName", "guardianRelationship", "guardianPhone", "nin", "schoolName",
    "schoolClass", "academicYear", "state", "term", "schoolType", "schoolOwnership",
    "studentCategory", "classType", "need", "details", "refereeId", "password", "confirmPassword",
  ]) {
    const v = formData.get(key);
    raw[key] = v === null || v === "" ? undefined : v;
  }
  raw.details = formData.get("details"); // required even if short
  raw.refereeId = formData.get("refereeId");
  raw.category = formData.get("category");

  const parsed = applySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  // Re-validate the Referee ID server-side. Scholarships require a State
  // Coordinator who covers the applicant's state.
  const refereeCode = d.refereeId.toUpperCase();
  const isScholarship = d.category === "SCHOLARSHIP";
  const referee = await prisma.user.findFirst({
    where: { userId: refereeCode, role: isScholarship ? ROLES.COORDINATOR : ROLES.MEMBER, approved: true, active: true },
  });
  if (!referee) {
    return {
      ok: false,
      error: isScholarship
        ? "Scholarship applications must be nominated by a valid State Coordinator."
        : "The Referee ID could not be verified. Please validate a referee before applying.",
    };
  }
  if (isScholarship) {
    const coordStates = parseStates(referee.states);
    if (!d.state || !coordStates.includes(d.state)) {
      return { ok: false, error: `This coordinator only nominates applicants from: ${coordStates.join(", ") || "—"}. Please select a matching state.` };
    }
  }

  const fullName = `${d.firstName} ${d.lastName}`.trim();

  // Determine the beneficiary account.
  const session = await getSession();
  let beneficiaryId: string | undefined;
  let createdAccount = false;
  let newUserId: string | undefined;

  if (session && session.role === ROLES.BENEFICIARY) {
    beneficiaryId = session.sub;
  } else if (session) {
    beneficiaryId = undefined;
  } else {
    if (!d.password || d.password.length < 6) {
      return { ok: false, error: "Please set a password (at least 6 characters) so you can track your application." };
    }
    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      return { ok: false, error: "An account with that email already exists. Please log in and apply from your dashboard." };
    }
    newUserId = await uniqueUserId();
    const beneficiary = await prisma.user.create({
      data: {
        name: fullName, email: d.email, passwordHash: await hashPassword(d.password),
        phone: d.contactPhone, country: d.country, role: ROLES.BENEFICIARY, userId: newUserId,
      },
    });
    beneficiaryId = beneficiary.id;
    createdAccount = true;
  }

  // Type-specific fields → formData JSON.
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries({
    firstName: d.firstName, lastName: d.lastName, address: d.address,
    guardianName: d.guardianName, guardianRelationship: d.guardianRelationship, guardianPhone: d.guardianPhone,
    nin: d.nin, schoolName: d.schoolName, schoolClass: d.schoolClass, academicYear: d.academicYear,
    state: d.state, term: d.term, schoolType: d.schoolType, schoolOwnership: d.schoolOwnership,
    studentCategory: d.studentCategory, classType: d.classType, need: d.need,
  })) {
    if (v) extra[k] = v;
  }

  // Admin-defined custom fields for this program (form builder).
  const customFields = await prisma.formField.findMany({
    where: { active: true, category: { in: [d.category, "ALL"] } },
  });
  for (const f of customFields) {
    const v = formData.get(f.name);
    if (typeof v === "string" && v.trim()) extra[f.name] = v.trim();
  }

  // Optional uploads — validate before persisting anything.
  const photoFile = formData.get("photo");
  const docFile = formData.get("document");
  let savedPhoto: { storedName: string; mimeType: string; size: number; originalName: string } | null = null;
  let savedDoc: { storedName: string; mimeType: string; size: number; originalName: string } | null = null;
  if (photoFile instanceof File && photoFile.size > 0) {
    const res = await saveUpload(photoFile, { imagesOnly: true });
    if (!res.ok) return { ok: false, error: res.error };
    savedPhoto = res.file;
  }
  if (docFile instanceof File && docFile.size > 0) {
    const res = await saveUpload(docFile);
    if (!res.ok) return { ok: false, error: res.error };
    savedDoc = res.file;
  }

  const reference = generateReference();
  const app = await prisma.application.create({
    data: {
      reference, category: d.category, status: "PENDING_REFEREE",
      fullName, email: d.email, phone: d.contactPhone, country: d.country, details: d.details,
      formData: JSON.stringify(extra),
      referredByCode: refereeCode, referredById: referee.id, beneficiaryId,
    },
  });

  if (savedPhoto) {
    await prisma.document.create({
      data: { applicationId: app.id, name: "Applicant photo", type: "Applicant photo", storedName: savedPhoto.storedName, mimeType: savedPhoto.mimeType, size: savedPhoto.size },
    });
    if (beneficiaryId) await prisma.user.update({ where: { id: beneficiaryId }, data: { imagePath: savedPhoto.storedName } });
  }
  if (savedDoc) {
    await prisma.document.create({
      data: { applicationId: app.id, name: savedDoc.originalName, type: "Supporting document", storedName: savedDoc.storedName, mimeType: savedDoc.mimeType, size: savedDoc.size },
    });
  }

  await prisma.notification.create({
    data: { userId: referee.id, title: "New referral to confirm", body: `${fullName} applied for ${d.category} and named you as referee. Please confirm you know them.` },
  });
  if (beneficiaryId) {
    await prisma.notification.create({
      data: { userId: beneficiaryId, title: "Application submitted", body: `Your ${d.category} application (ref ${reference}) is awaiting referee confirmation.` },
    });
  }
  await prisma.activityLog.create({ data: { userId: beneficiaryId, action: "APPLICATION_SUBMITTED", detail: `${d.category} · ref ${reference}` } });

  return { ok: true, reference, userId: newUserId, createdAccount };
}
