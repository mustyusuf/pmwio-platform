import { prisma } from "@/lib/db";
import {
  handleSubscriptionEvent,
  recordSuccessfulCharge,
  validPaystackSignature,
  type PaystackTransaction,
} from "@/lib/paystack";

// Paystack nests the subscription differently by event: subscription.* events
// carry `subscription_code` on `data`, while invoice.* events carry a
// `subscription` object.
type WebhookEvent = {
  event: string;
  data: PaystackTransaction & {
    subscription_code?: string;
    next_payment_date?: string | null;
    subscription?: { subscription_code?: string; next_payment_date?: string | null };
    customer?: { email?: string; customer_code?: string };
    plan?: { plan_code?: string };
  };
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

  const { event, data } = payload;
  const subscriptionCode = data.subscription_code ?? data.subscription?.subscription_code;

  if (event === "charge.success") {
    await recordSuccessfulCharge(data);
  }

  if (event === "subscription.create") {
    const email = data.customer?.email?.toLowerCase();
    const planCode = typeof data.plan === "object" ? data.plan?.plan_code : null;
    if (email && planCode && data.subscription_code) {
      await prisma.contributionSubscription.updateMany({
        where: { member: { email }, plan: { paystackPlanCode: planCode } },
        data: {
          status: "ACTIVE",
          paystackSubscriptionCode: data.subscription_code,
          paystackCustomerCode: data.customer?.customer_code,
          nextPaymentAt: parseDate(data.next_payment_date),
        },
      });
    }
  }

  if (subscriptionCode) {
    if (event === "subscription.disable") await handleSubscriptionEvent("cancelled", subscriptionCode);
    if (event === "subscription.not_renew") await handleSubscriptionEvent("not_renewing", subscriptionCode);
    if (event === "invoice.payment_failed") await handleSubscriptionEvent("payment_failed", subscriptionCode);
    if (event === "invoice.create") {
      await handleSubscriptionEvent("upcoming", subscriptionCode, { nextPaymentAt: parseDate(data.subscription?.next_payment_date) });
    }
  }

  return Response.json({ received: true });
}
