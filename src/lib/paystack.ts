import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

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

/** Idempotently reconciles a successful Paystack charge into the local ledger. */
export async function recordSuccessfulCharge(data: PaystackTransaction) {
  if (data.status !== "success") return false;

  const existing = await prisma.donation.findUnique({ where: { reference: data.reference } });
  if (existing) {
    if (data.amount !== Math.round(existing.amount * 100) || data.currency !== existing.currency) {
      return false;
    }
    await prisma.$transaction([
      prisma.donation.update({
        where: { id: existing.id },
        data: {
          status: "SUCCESS",
          channel: data.channel ?? null,
          paystackId: String(data.id),
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        },
      }),
      ...(existing.subscriptionId
        ? [
            prisma.contributionSubscription.update({
              where: { id: existing.subscriptionId },
              data: {
                status: "ACTIVE",
                paystackCustomerCode: data.customer?.customer_code ?? undefined,
                lastPaymentAt: data.paid_at ? new Date(data.paid_at) : new Date(),
              },
            }),
          ]
        : []),
    ]);
    return true;
  }

  // Subscription renewals use Paystack-generated references. Reconcile them by
  // the customer's member email and the plan attached to the charge.
  const email = data.customer?.email?.toLowerCase();
  const planCode = planCodeOf(data.plan);
  if (!email || !planCode) return false;

  const subscription = await prisma.contributionSubscription.findFirst({
    where: { member: { email }, plan: { paystackPlanCode: planCode } },
    include: { member: true },
  });
  if (!subscription || data.amount !== Math.round(subscription.amount * 100)) return false;

  await prisma.$transaction([
    prisma.donation.upsert({
      where: { reference: data.reference },
      create: {
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
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
      },
      update: {
        status: "SUCCESS",
        channel: data.channel ?? null,
        paystackId: String(data.id),
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
      },
    }),
    prisma.contributionSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        paystackCustomerCode: data.customer?.customer_code ?? undefined,
        lastPaymentAt: data.paid_at ? new Date(data.paid_at) : new Date(),
      },
    }),
  ]);
  return true;
}

export function appUrl() {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
