import { prisma } from "@/lib/db";
import {
  recordSuccessfulCharge,
  validPaystackSignature,
  type PaystackTransaction,
} from "@/lib/paystack";

type WebhookEvent = {
  event: string;
  data: PaystackTransaction & {
    subscription_code?: string;
    next_payment_date?: string | null;
    customer?: { email?: string; customer_code?: string };
    plan?: { plan_code?: string };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookEvent;
  try {
    payload = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (payload.event === "charge.success") {
    await recordSuccessfulCharge(payload.data);
  }

  if (payload.event === "subscription.create") {
    const email = payload.data.customer?.email?.toLowerCase();
    const planCode = typeof payload.data.plan === "object" ? payload.data.plan?.plan_code : null;
    if (email && planCode && payload.data.subscription_code) {
      await prisma.contributionSubscription.updateMany({
        where: { member: { email }, plan: { paystackPlanCode: planCode } },
        data: {
          status: "ACTIVE",
          paystackSubscriptionCode: payload.data.subscription_code,
          paystackCustomerCode: payload.data.customer?.customer_code,
          nextPaymentAt: payload.data.next_payment_date ? new Date(payload.data.next_payment_date) : null,
        },
      });
    }
  }

  if (["subscription.disable", "subscription.not_renew"].includes(payload.event)) {
    if (payload.data.subscription_code) {
      await prisma.contributionSubscription.updateMany({
        where: { paystackSubscriptionCode: payload.data.subscription_code },
        data: { status: payload.event === "subscription.disable" ? "DISABLED" : "NOT_RENEWING" },
      });
    }
  }

  if (payload.event === "invoice.payment_failed" && payload.data.subscription_code) {
    await prisma.contributionSubscription.updateMany({
      where: { paystackSubscriptionCode: payload.data.subscription_code },
      data: { status: "PAST_DUE" },
    });
  }

  return Response.json({ received: true });
}
