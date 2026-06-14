"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, generateReference } from "@/lib/auth";
import { uniqueUserId } from "@/app/actions/auth";
import { ROLES } from "@/lib/roles";
import { SCHOLARSHIP_MAX_AWARD } from "@/lib/content";
import { getSettings, eligibleCount, clampQuorum, tally } from "@/lib/settings";

async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) redirect("/dashboard");
  return user!;
}

function notify(userId: string | null | undefined, title: string, body: string) {
  if (!userId) return Promise.resolve();
  return prisma.notification.create({ data: { userId, title, body } });
}

// ---------- Referee (Member) ----------

export async function confirmReferral(formData: FormData) {
  const me = await requireRole([ROLES.MEMBER]);
  const id = String(formData.get("applicationId"));
  const comment = String(formData.get("comment") ?? "").trim();
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.referredById !== me.id || app.status !== "PENDING_REFEREE") redirect("/dashboard");

  await prisma.application.update({ where: { id }, data: { status: "PENDING_BOARD" } });
  await prisma.review.create({ data: { applicationId: id, reviewerId: me.id, reviewerRole: "REFEREE", recommendation: "CONFIRM", comment: comment || null } });
  await notify(app!.beneficiaryId, "Referral confirmed", `${me.name} confirmed your application (ref ${app!.reference}). It is now with the Board for review.`);
  await prisma.activityLog.create({ data: { userId: me.id, action: "REFERRAL_CONFIRMED", detail: app!.reference } });
  revalidatePath("/dashboard");
}

export async function rejectReferral(formData: FormData) {
  const me = await requireRole([ROLES.MEMBER]);
  const id = String(formData.get("applicationId"));
  const comment = String(formData.get("comment") ?? "").trim();
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.referredById !== me.id || app.status !== "PENDING_REFEREE") redirect("/dashboard");

  await prisma.application.update({ where: { id }, data: { status: "REFEREE_REJECTED" } });
  await prisma.review.create({ data: { applicationId: id, reviewerId: me.id, reviewerRole: "REFEREE", recommendation: "REJECT", comment: comment || null } });
  await notify(app!.beneficiaryId, "Referral not confirmed", `Your application (ref ${app!.reference}) was not confirmed by the referee.`);
  await prisma.activityLog.create({ data: { userId: me.id, action: "REFERRAL_REJECTED", detail: app!.reference } });
  revalidatePath("/dashboard");
}

// ---------- Board & Executive quorum votes on applications ----------

async function castApplicationVote(opts: {
  me: { id: string; name: string };
  stage: "BOARD" | "EXECUTIVE";
  applicationId: string;
  decision: string; // APPROVE | REJECT
  comment: string;
}) {
  const { me, stage, applicationId: id, decision, comment } = opts;
  const expectedStatus = stage === "BOARD" ? "PENDING_BOARD" : "PENDING_EXECUTIVE";
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.status !== expectedStatus) redirect("/dashboard");

  // One vote per reviewer per stage.
  const already = await prisma.review.findFirst({ where: { applicationId: id, reviewerId: me.id, reviewerRole: stage } });
  if (already) redirect("/dashboard");

  const recommendation =
    stage === "BOARD"
      ? decision === "APPROVE" ? "RECOMMEND_APPROVE" : "RECOMMEND_REJECT"
      : decision === "APPROVE" ? "APPROVE" : "REJECT";
  await prisma.review.create({ data: { applicationId: id, reviewerId: me.id, reviewerRole: stage, recommendation, comment: comment || null } });

  const votes = await prisma.review.findMany({ where: { applicationId: id, reviewerRole: stage } });
  const { approve, reject } = tally(votes);
  const settings = await getSettings();
  const eligible = await eligibleCount(stage === "BOARD" ? ROLES.BOARD : ROLES.EXECUTIVE);
  const quorum = clampQuorum(stage === "BOARD" ? settings.boardQuorum : settings.executiveQuorum, eligible);

  if (stage === "BOARD") {
    if (approve >= quorum) {
      await prisma.application.update({ where: { id }, data: { status: "PENDING_EXECUTIVE", boardRecommendation: "APPROVE" } });
      await notify(app!.beneficiaryId, "Passed board review", `Your application (ref ${app!.reference}) was recommended by the Board and is with the Executive.`);
    } else if (reject >= quorum) {
      await prisma.application.update({ where: { id }, data: { status: "REJECTED", boardRecommendation: "REJECT" } });
      await notify(app!.beneficiaryId, "Application decision", `Your application (ref ${app!.reference}) was not approved at board review.`);
    }
  } else {
    if (approve >= quorum) {
      await prisma.application.update({ where: { id }, data: { status: "APPROVED" } });
      await notify(app!.beneficiaryId, "Application approved 🎉", `Your application (ref ${app!.reference}) has been approved. Finance will arrange a disbursement.`);
    } else if (reject >= quorum) {
      await prisma.application.update({ where: { id }, data: { status: "REJECTED" } });
      await notify(app!.beneficiaryId, "Application decision", `Your application (ref ${app!.reference}) was not approved.`);
    }
  }
  await prisma.activityLog.create({ data: { userId: me.id, action: `${stage}_VOTE`, detail: `${app!.reference} · ${decision} (${approve}/${quorum})` } });
  revalidatePath("/dashboard");
}

export async function castBoardVote(formData: FormData) {
  const me = await requireRole([ROLES.BOARD]);
  await castApplicationVote({
    me,
    stage: "BOARD",
    applicationId: String(formData.get("applicationId")),
    decision: String(formData.get("decision")),
    comment: String(formData.get("comment") ?? "").trim(),
  });
}

export async function castExecutiveVote(formData: FormData) {
  const me = await requireRole([ROLES.EXECUTIVE]);
  await castApplicationVote({
    me,
    stage: "EXECUTIVE",
    applicationId: String(formData.get("applicationId")),
    decision: String(formData.get("decision")),
    comment: String(formData.get("comment") ?? "").trim(),
  });
}

// ---------- Finance: enter a payment for an approved application ----------

const paymentSchema = z.object({
  applicationId: z.string().min(1),
  amount: z.coerce.number().positive("Enter a valid amount."),
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

export type PaymentEntryState = { ok?: boolean; error?: string } | null;

export async function createPayment(_prev: PaymentEntryState, formData: FormData): Promise<PaymentEntryState> {
  const me = await requireRole([ROLES.FINANCE]);
  const parsed = paymentSchema.safeParse({
    applicationId: formData.get("applicationId"),
    amount: formData.get("amount"),
    method: formData.get("method") || undefined,
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." };

  const app = await prisma.application.findUnique({ where: { id: parsed.data.applicationId } });
  if (!app || app.status !== "APPROVED") return { error: "Application is not approved for payment." };

  // Scholarships are capped.
  if (app.category === "SCHOLARSHIP" && parsed.data.amount > SCHOLARSHIP_MAX_AWARD) {
    return { error: `Scholarship awards cannot exceed ₦${SCHOLARSHIP_MAX_AWARD.toLocaleString("en-NG")}.` };
  }

  const existing = await prisma.payment.findFirst({ where: { applicationId: app.id, status: { not: "REJECTED" } } });
  if (existing) return { error: "A payment already exists for this application." };

  await prisma.payment.create({
    data: {
      applicationId: app.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference,
      createdById: me.id,
      status: "PENDING_BOARD",
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "PAYMENT_ENTERED", detail: `${app.reference} · ₦${parsed.data.amount}` } });
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------- Board & Executive quorum approval of payments ----------

export async function castPaymentVote(formData: FormData) {
  const me = await requireRole([ROLES.BOARD, ROLES.EXECUTIVE]);
  const id = String(formData.get("paymentId"));
  const decision = String(formData.get("decision")); // APPROVE | REJECT
  const comment = String(formData.get("comment") ?? "").trim();
  if (!["APPROVE", "REJECT"].includes(decision)) redirect("/dashboard");

  const level = me.role === ROLES.BOARD ? "BOARD" : "EXECUTIVE";
  const expectedStatus = level === "BOARD" ? "PENDING_BOARD" : "PENDING_EXECUTIVE";
  const payment = await prisma.payment.findUnique({ where: { id }, include: { application: true } });
  if (!payment || payment.status !== expectedStatus) redirect("/dashboard");

  const already = await prisma.paymentApproval.findFirst({ where: { paymentId: id, approverId: me.id, role: level } });
  if (already) redirect("/dashboard");

  await prisma.paymentApproval.create({ data: { paymentId: id, approverId: me.id, role: level, decision, comment: comment || null } });

  const votes = await prisma.paymentApproval.findMany({ where: { paymentId: id, role: level } });
  const { approve, reject } = tally(votes);
  const settings = await getSettings();
  const eligible = await eligibleCount(level === "BOARD" ? ROLES.BOARD : ROLES.EXECUTIVE);
  const quorum = clampQuorum(level === "BOARD" ? settings.boardQuorum : settings.executiveQuorum, eligible);

  if (level === "BOARD") {
    if (approve >= quorum) await prisma.payment.update({ where: { id }, data: { status: "PENDING_EXECUTIVE" } });
    else if (reject >= quorum) await prisma.payment.update({ where: { id }, data: { status: "REJECTED" } });
  } else {
    if (approve >= quorum) {
      await prisma.payment.update({ where: { id }, data: { status: "COMPLETED", paidAt: new Date(), approvedById: me.id, method: payment.method ?? "Bank transfer" } });
      if (payment.application?.beneficiaryId) {
        await notify(payment.application.beneficiaryId, "Payment disbursed 🎉", `A payment of ₦${payment.amount.toLocaleString()} has been disbursed (ref ${payment.application.reference}).`);
      }
    } else if (reject >= quorum) {
      await prisma.payment.update({ where: { id }, data: { status: "REJECTED" } });
    }
  }
  await prisma.activityLog.create({ data: { userId: me.id, action: `PAYMENT_${level}_VOTE`, detail: `₦${payment.amount} · ${decision} (${approve}/${quorum})` } });
  revalidatePath("/dashboard");
}

// ---------- Administrator: users & settings ----------

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().toLowerCase(),
  password: z.string().min(6),
  role: z.enum([ROLES.EXECUTIVE, ROLES.BOARD, ROLES.ADMIN, ROLES.FINANCE, ROLES.COORDINATOR, ROLES.MEMBER]),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

export type AdminState = { ok?: boolean; error?: string; created?: string } | null;

export async function createStaffUser(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    country: formData.get("country") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "A user with that email already exists." };

  // State Coordinators carry the list of states they represent.
  let states: string | null = null;
  if (parsed.data.role === ROLES.COORDINATOR) {
    const chosen = formData.getAll("states").map(String).filter(Boolean);
    if (chosen.length === 0) return { error: "Select at least one state for the coordinator." };
    states = JSON.stringify(chosen);
  }

  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
      phone: parsed.data.phone,
      country: parsed.data.country,
      states,
      userId: await uniqueUserId(),
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "USER_CREATED", detail: `${created.role} · ${created.email}` } });
  revalidatePath("/dashboard");
  return { ok: true, created: created.userId };
}

export async function setUserActive(formData: FormData) {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const id = String(formData.get("userId"));
  const active = String(formData.get("active")) === "true";
  if (id === me.id) redirect("/dashboard");
  await prisma.user.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({ data: { userId: me.id, action: active ? "USER_ENABLED" : "USER_DISABLED", detail: id } });
  revalidatePath("/dashboard");
}

/** Approve a self-registered member so they can log in. */
export async function approveMember(formData: FormData) {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const id = String(formData.get("userId"));
  const user = await prisma.user.update({ where: { id }, data: { approved: true, active: true } });
  await prisma.notification.create({ data: { userId: id, title: "Account approved 🎉", body: "Your membership has been approved. You can now log in." } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "MEMBER_APPROVED", detail: `${user.name} (${user.userId})` } });
  revalidatePath("/dashboard/users");
}

/** Decline a pending member registration (removes the unapproved account). */
export async function rejectMember(formData: FormData) {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const id = String(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (user && !user.approved) {
    await prisma.user.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: me.id, action: "MEMBER_DECLINED", detail: `${user.name} (${user.email})` } });
  }
  revalidatePath("/dashboard/users");
}

export async function updateSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const board = Number(formData.get("boardQuorum"));
  const exec = Number(formData.get("executiveQuorum"));
  if (!Number.isInteger(board) || !Number.isInteger(exec) || board < 1 || exec < 1 || board > 20 || exec > 20) {
    return { error: "Quorums must be whole numbers between 1 and 20." };
  }
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { boardQuorum: board, executiveQuorum: exec },
    create: { id: "singleton", boardQuorum: board, executiveQuorum: exec },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "SETTINGS_UPDATED", detail: `board=${board}, exec=${exec}` } });
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleEmpowerment(formData: FormData) {
  const me = await requireRole([ROLES.ADMIN, ROLES.EXECUTIVE]);
  const open = String(formData.get("open")) === "true";
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { empowermentOpen: open },
    create: { id: "singleton", empowermentOpen: open },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: open ? "EMPOWERMENT_OPENED" : "EMPOWERMENT_CLOSED", detail: "members' empowerment window" } });
  revalidatePath("/dashboard");
}

export async function markNotificationsRead() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  await prisma.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } });
  revalidatePath("/dashboard");
}
