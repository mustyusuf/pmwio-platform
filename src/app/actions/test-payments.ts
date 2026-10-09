"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";

export type TestPaymentsPreview = {
  cutoff: string; // the cutoff exactly as the admin typed it ("YYYY-MM-DDTHH:mm", Nigeria time)
  donations: number;
  successfulTotal: number;
  subscriptions: number;
  plans: number;
  keptDonations: number;
};

export type TestPaymentsState =
  | { error: string; preview?: TestPaymentsPreview }
  | { preview: TestPaymentsPreview }
  | { deleted: { donations: number; subscriptions: number; plans: number } }
  | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

// The admin types the cutoff in Nigeria time (WAT, UTC+1, no DST), whatever
// timezone the server or their browser happens to be in.
function parseCutoff(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+01:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Everything created before `cutoff` is treated as test-mode data: donations,
 * member contribution subscriptions, and the Paystack plans (whose plan codes
 * only exist in Paystack's test environment). A subscription or plan that
 * still has newer records pointing at it is left alone.
 */
async function findTestPayments(cutoff: Date) {
  const donations = await prisma.donation.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, amount: true, status: true },
  });
  const donationIds = donations.map((d) => d.id);

  const subscriptions = await prisma.contributionSubscription.findMany({
    where: {
      createdAt: { lt: cutoff },
      donations: { every: { id: { in: donationIds } } },
    },
    select: { id: true },
  });
  const subscriptionIds = subscriptions.map((s) => s.id);

  const plans = await prisma.contributionPlan.findMany({
    where: {
      createdAt: { lt: cutoff },
      subscriptions: { every: { id: { in: subscriptionIds } } },
    },
    select: { id: true },
  });

  const keptDonations = await prisma.donation.count({ where: { createdAt: { gte: cutoff } } });

  return {
    donationIds,
    subscriptionIds,
    planIds: plans.map((p) => p.id),
    successfulTotal: donations.filter((d) => d.status === "SUCCESS").reduce((sum, d) => sum + d.amount, 0),
    keptDonations,
  };
}

export async function manageTestPayments(_prev: TestPaymentsState, formData: FormData): Promise<TestPaymentsState> {
  const me = await requireAdmin();
  const intent = String(formData.get("intent") ?? "preview");

  const cutoffValue = String((intent === "delete" ? formData.get("confirmCutoff") : formData.get("cutoff")) ?? "");
  const cutoff = parseCutoff(cutoffValue);
  if (!cutoff) return { error: "Pick the date and time you switched Paystack to live." };
  if (cutoff.getTime() > Date.now()) return { error: "The cutoff can't be in the future." };

  const found = await findTestPayments(cutoff);
  const preview: TestPaymentsPreview = {
    cutoff: cutoffValue,
    donations: found.donationIds.length,
    successfulTotal: found.successfulTotal,
    subscriptions: found.subscriptionIds.length,
    plans: found.planIds.length,
    keptDonations: found.keptDonations,
  };

  if (intent !== "delete") return { preview };

  if (String(formData.get("confirmText") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE exactly to confirm.", preview };
  }
  // The admin confirmed specific numbers; if the data changed since the
  // preview (a payment landed, someone else deleted), make them look again.
  if (
    String(preview.donations) !== String(formData.get("expectedDonations")) ||
    String(preview.subscriptions) !== String(formData.get("expectedSubscriptions")) ||
    String(preview.plans) !== String(formData.get("expectedPlans"))
  ) {
    return { preview };
  }

  // Order matters: donations reference subscriptions, subscriptions reference plans.
  await prisma.$transaction([
    prisma.donation.deleteMany({ where: { id: { in: found.donationIds } } }),
    prisma.contributionSubscription.deleteMany({ where: { id: { in: found.subscriptionIds } } }),
    prisma.contributionPlan.deleteMany({ where: { id: { in: found.planIds } } }),
  ]);

  await prisma.activityLog.create({
    data: {
      userId: me.id,
      action: "TEST_PAYMENTS_DELETED",
      detail: `Before ${cutoffValue} WAT: ${preview.donations} donation(s), ${preview.subscriptions} subscription(s), ${preview.plans} plan(s)`,
    },
  });

  revalidatePath("/dashboard/donations");
  return { deleted: { donations: preview.donations, subscriptions: preview.subscriptions, plans: preview.plans } };
}
