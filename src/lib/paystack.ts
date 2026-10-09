import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { send, recipientsByRole, type Mail } from "@/lib/email";
import {
  donationReceipt,
  donationAlert,
  donationNotCompleted,
  contributionUpcoming,
  contributionPaymentFailed,
  contributionEnded,
  contributionStaffAlert,
} from "@/lib/email-templates";
import { ROLES } from "@/lib/roles";

const API_URL = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok || !body.status) {
    throw new Error(body.message || "Paystack request failed.");
  }
  return body.data as T;
}

export type PaystackTransaction = {
  id: number;
  reference: string;
  status: string;
  amount: number;
  // What the donor asked to give, before any Paystack fee passed on to them.
  requested_amount?: number;
  currency: string;
  channel?: string;
  paid_at?: string | null;
  metadata?: unknown;
  customer?: { email?: string; customer_code?: string };
  plan?: { plan_code?: string } | string | null;
};

export function initializePaystackTransaction(input: {
  email: string;
  amountKobo?: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  planCode?: string;
}) {
  return request<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        ...(input.amountKobo ? { amount: String(input.amountKobo) } : {}),
        ...(input.planCode ? { plan: input.planCode } : {}),
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: JSON.stringify(input.metadata),
      }),
    },
  );
}

export function verifyPaystackTransaction(reference: string) {
  return request<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function createPaystackPlan(amountKobo: number) {
  return request<{ plan_code: string }>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: `PMWIO monthly contribution - NGN ${(amountKobo / 100).toLocaleString("en-NG")}`,
      amount: amountKobo,
      interval: "monthly",
      description: "Monthly member contribution to Pious Muslim Women International Organization",
      send_invoices: true,
      send_sms: true,
      currency: "NGN",
    }),
  });
}

export function validPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function planCodeOf(plan: PaystackTransaction["plan"]) {
  if (!plan) return null;
  return typeof plan === "string" ? plan : plan.plan_code ?? null;
}

// Who is told about money coming in (and monthly contributions going wrong).
// Finance already has the Donations dashboard, so they get the alerts too.
const STAFF_ROLES = [ROLES.ADMIN, ROLES.EXECUTIVE, ROLES.FINANCE];

async function notifyStaff(mail: Mail) {
  const staff = await recipientsByRole(STAFF_ROLES);
  if (staff.length > 0) await send(staff, mail);
}

const addOneMonth = (d: Date) => {
  const next = new Date(d);
  next.setMonth(next.getMonth() + 1);
  return next;
};

type SuccessEmailInput = {
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  reference: string;
  type: string; // GENERAL | CAMPAIGN | MEMBER_CONTRIBUTION
  campaign?: string | null;
  message?: string | null;
  firstContribution?: boolean;
  nextPaymentAt?: Date | null;
};

/**
 * Emails a donor their receipt (#28/#30) and alerts staff (#29). Best-effort:
 * send() never throws. Callers must make sure this runs exactly once per
 * payment (see the atomic claims in recordSuccessfulCharge).
 */
async function sendDonationEmails(d: SuccessEmailInput) {
  const name = d.donorName ?? "Supporter";
  const recurring = d.type === "MEMBER_CONTRIBUTION";
  if (d.donorEmail) {
    await send(
      d.donorEmail,
      donationReceipt({
        name,
        amount: d.amount,
        reference: d.reference,
        recurring,
        firstContribution: d.firstContribution,
        nextPaymentAt: d.nextPaymentAt,
        campaign: d.campaign,
      }),
    );
  }
  await notifyStaff(
    donationAlert({
      donorName: name,
      amount: d.amount,
      reference: d.reference,
      kind: recurring ? (d.firstContribution ? "monthly-first" : "monthly") : d.type === "CAMPAIGN" ? "campaign" : "general",
      campaign: d.campaign,
      message: d.message,
    }),
  );
}

/**
 * Whether a charge covers what we expected. When Paystack is set to pass its
 * fee on to the donor, the charge is a little MORE than the donation (e.g.
 * ₦507.62 for a ₦500 gift), so an exact match would wrongly reject real
 * payments. We only guard against underpayment; the donation is recorded at
 * the amount the donor chose to give.
 */
function coversAmount(data: PaystackTransaction, expectedNaira: number) {
  const expectedKobo = Math.round(expectedNaira * 100);
  return data.amount >= expectedKobo && (data.requested_amount ?? expectedKobo) >= expectedKobo;
}

/** Idempotently reconciles a successful Paystack charge into the local ledger. */
export async function recordSuccessfulCharge(data: PaystackTransaction) {
  if (data.status !== "success") return false;
  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

  const existing = await prisma.donation.findUnique({
    where: { reference: data.reference },
    include: { campaign: { select: { title: true } }, subscription: true },
  });
  if (existing) {
    if (!coversAmount(data, existing.amount) || data.currency !== existing.currency) {
      console.warn(
        `[paystack] ${data.reference}: charged ${data.amount} ${data.currency} (requested ${data.requested_amount ?? "n/a"}) doesn't cover the expected ${Math.round(existing.amount * 100)} ${existing.currency} — not recorded.`,
      );
      return false;
    }
    // Claim the PENDING/FAILED -> SUCCESS transition atomically. The browser
    // callback and the webhook usually both arrive; only the one that wins the
    // claim sends emails, so nobody gets a duplicate receipt.
    const claimed = await prisma.donation.updateMany({
      where: { id: existing.id, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", channel: data.channel ?? null, paystackId: String(data.id), paidAt },
    });
    if (claimed.count === 0) return true;

    const subscription = existing.subscription;
    const nextPaymentAt = subscription ? addOneMonth(paidAt) : null;
    if (subscription) {
      await prisma.contributionSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          paystackCustomerCode: data.customer?.customer_code ?? undefined,
          lastPaymentAt: paidAt,
          nextPaymentAt,
        },
      });
    }
    await sendDonationEmails({
      donorName: existing.donorName,
      donorEmail: existing.donorEmail,
      amount: existing.amount,
      reference: existing.reference,
      type: existing.type,
      campaign: existing.campaign?.title,
      message: existing.message,
      firstContribution: subscription ? !subscription.lastPaymentAt : false,
      nextPaymentAt,
    });
    return true;
  }

  // Subscription renewals use Paystack-generated references. Reconcile them by
  // the customer's member email and the plan attached to the charge.
  const email = data.customer?.email?.toLowerCase();
  const planCode = planCodeOf(data.plan);
  if (!email || !planCode) {
    console.warn(`[paystack] ${data.reference}: successful charge doesn't belong to a known donation or plan — ignored.`);
    return false;
  }

  const subscription = await prisma.contributionSubscription.findFirst({
    where: { member: { email }, plan: { paystackPlanCode: planCode } },
    include: { member: true },
  });
  if (!subscription || !coversAmount(data, subscription.amount)) {
    console.warn(`[paystack] ${data.reference}: renewal for ${email} doesn't match a subscription — not recorded.`);
    return false;
  }

  const nextPaymentAt = addOneMonth(paidAt);
  try {
    // The unique reference makes this atomic: if a duplicate webhook delivery
    // races us, its create fails and it exits without sending emails.
    await prisma.$transaction([
      prisma.donation.create({
        data: {
          reference: data.reference,
          type: "MEMBER_CONTRIBUTION",
          status: "SUCCESS",
          amount: data.amount / 100,
          currency: data.currency,
          donorName: subscription.member.name,
          donorEmail: subscription.member.email,
          memberId: subscription.memberId,
          subscriptionId: subscription.id,
          channel: data.channel ?? null,
          paystackId: String(data.id),
          paidAt,
        },
      }),
      prisma.contributionSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          paystackCustomerCode: data.customer?.customer_code ?? undefined,
          lastPaymentAt: paidAt,
          nextPaymentAt,
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return true;
    throw error;
  }
  await sendDonationEmails({
    donorName: subscription.member.name,
    donorEmail: subscription.member.email,
    amount: data.amount / 100,
    reference: data.reference,
    type: "MEMBER_CONTRIBUTION",
    firstContribution: !subscription.lastPaymentAt,
    nextPaymentAt,
  });
  return true;
}

/**
 * Marks a still-PENDING donation as FAILED (declined, cancelled or abandoned
 * at checkout) and tells the donor it wasn't completed. Only the caller that
 * flips PENDING -> FAILED sends the email, so it goes out once. If the donor
 * does pay later with the same link, recordSuccessfulCharge still turns it
 * into a SUCCESS.
 */
export async function markDonationFailed(reference: string, opts: { notify?: boolean } = {}) {
  const claimed = await prisma.donation.updateMany({ where: { reference, status: "PENDING" }, data: { status: "FAILED" } });
  if (claimed.count === 0) return false;
  if (opts.notify === false) return true;

  const donation = await prisma.donation.findUnique({
    where: { reference },
    include: { campaign: { select: { title: true } } },
  });
  if (donation?.donorEmail) {
    await send(
      donation.donorEmail,
      donationNotCompleted({
        name: donation.donorName ?? "Supporter",
        amount: donation.amount,
        reference: donation.reference,
        campaign: donation.campaign?.title,
      }),
    );
  }
  return true;
}

const ABANDONED_STATUSES = ["failed", "abandoned", "reversed"];

/** Asks Paystack what happened to a transaction and records the outcome. */
export async function settleTransaction(reference: string) {
  const transaction = await verifyPaystackTransaction(reference);
  if (transaction.status === "success") {
    // false means the charge couldn't be matched to a donation (e.g. amount
    // mismatch) — don't tell the donor it's recorded.
    return (await recordSuccessfulCharge(transaction)) ? ("success" as const) : ("pending" as const);
  }
  if (ABANDONED_STATUSES.includes(transaction.status)) {
    await markDonationFailed(reference);
    return "failed" as const;
  }
  return "pending" as const;
}

/**
 * Daily safety net for donations stuck as PENDING (the donor closed the tab,
 * or a webhook never arrived): checks each with Paystack, records real
 * payments, and marks genuinely abandoned ones FAILED so the dashboards
 * don't carry them as pending forever.
 */
export async function reconcilePendingDonations() {
  const now = Date.now();
  const stale = await prisma.donation.findMany({
    where: { status: "PENDING", createdAt: { lt: new Date(now - 2 * 3600_000), gt: new Date(now - 30 * 86_400_000) } },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { reference: true },
  });
  for (const { reference } of stale) {
    try {
      await settleTransaction(reference);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // Paystack never heard of it (checkout never opened): close it quietly.
      if (/not found/i.test(message)) await markDonationFailed(reference, { notify: false });
      else console.error(`[paystack] couldn't reconcile ${reference}:`, error);
    }
  }
}

export type SubscriptionEvent = "payment_failed" | "not_renewing" | "cancelled" | "upcoming";

/**
 * Handles Paystack subscription lifecycle webhooks: updates the stored status
 * and emails the member (and staff for problems). Status changes are claimed
 * atomically so a retried webhook doesn't send the same email twice.
 */
export async function handleSubscriptionEvent(
  event: SubscriptionEvent,
  subscriptionCode: string,
  opts: { nextPaymentAt?: Date | null } = {},
) {
  const subscription = await prisma.contributionSubscription.findFirst({
    where: { paystackSubscriptionCode: subscriptionCode },
    include: { member: { select: { name: true, email: true } } },
  });
  if (!subscription) {
    console.warn(`[paystack] subscription event ${event} for unknown subscription ${subscriptionCode}.`);
    return;
  }
  const { member, amount } = subscription;

  if (event === "upcoming") {
    if (opts.nextPaymentAt) {
      await prisma.contributionSubscription.update({ where: { id: subscription.id }, data: { nextPaymentAt: opts.nextPaymentAt } });
    }
    await send(member.email, contributionUpcoming({ name: member.name, amount, date: opts.nextPaymentAt ?? subscription.nextPaymentAt }));
    return;
  }

  const status = { payment_failed: "PAST_DUE", not_renewing: "NOT_RENEWING", cancelled: "DISABLED" }[event];
  const changed = await prisma.contributionSubscription.updateMany({
    where: { id: subscription.id, status: { not: status } },
    data: { status },
  });
  if (changed.count === 0) return;

  if (event === "payment_failed") {
    await send(member.email, contributionPaymentFailed({ name: member.name, amount }));
  } else {
    await send(member.email, contributionEnded({ name: member.name, amount, stopped: event === "cancelled" }));
  }
  await notifyStaff(contributionStaffAlert({ memberName: member.name, amount, event }));
}

export function appUrl() {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
