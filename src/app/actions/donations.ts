"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import {
  appUrl,
  createPaystackPlan,
  initializePaystackTransaction,
} from "@/lib/paystack";

function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(5).toString("hex")}`;
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const publicDonationSchema = z.object({
  campaignId: z.string().trim().optional(),
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address.").toLowerCase(),
  phone: z.string().trim().optional(),
  amount: z.coerce.number().min(100, "The minimum donation is ₦100."),
  message: z.string().trim().max(500).optional(),
  anonymous: z.boolean(),
});

export async function startPublicDonation(formData: FormData) {
  const parsed = publicDonationSchema.safeParse({
    campaignId: formData.get("campaignId") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    amount: formData.get("amount"),
    message: formData.get("message") || undefined,
    anonymous: formData.get("anonymous") === "on",
  });
  const returnPath = String(formData.get("returnPath") || "/donate");
  if (!parsed.success) errorRedirect(returnPath, parsed.error.issues[0]?.message ?? "Please check the form.");
  const d = parsed.data;

  let campaign: { id: string; slug: string } | null = null;
  if (d.campaignId) {
    const now = new Date();
    campaign = await prisma.donationCampaign.findFirst({
      where: {
        id: d.campaignId,
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: { id: true, slug: true },
    });
    if (!campaign) errorRedirect(returnPath, "This donation campaign is not currently accepting donations.");
  }

  const ref = reference("DON");
  const donation = await prisma.donation.create({
    data: {
      reference: ref,
      type: campaign ? "CAMPAIGN" : "GENERAL",
      amount: d.amount,
      donorName: d.name,
      donorEmail: d.email,
      donorPhone: d.phone,
      anonymous: d.anonymous,
      message: d.message,
      campaignId: campaign?.id,
    },
  });

  try {
    const initialized = await initializePaystackTransaction({
      email: d.email,
      amountKobo: Math.round(d.amount * 100),
      reference: ref,
      callbackUrl: `${appUrl()}/api/paystack/callback`,
      metadata: {
        donationId: donation.id,
        donationType: donation.type,
        campaignId: campaign?.id ?? null,
        donorName: d.name,
      },
    });
    redirect(initialized.authorization_url);
  } catch (error) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });
    errorRedirect(returnPath, error instanceof Error ? error.message : "Unable to start payment.");
  }
}

const contributionSchema = z.object({
  amount: z.coerce.number().min(500, "The minimum monthly contribution is ₦500."),
});

export async function startMonthlyContribution(formData: FormData) {
  const member = await getCurrentUser();
  if (!member || member.role !== ROLES.MEMBER) redirect("/dashboard");

  const parsed = contributionSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) errorRedirect("/dashboard/contributions", parsed.error.issues[0]?.message ?? "Enter an amount.");
  const amount = parsed.data.amount;
  const amountKobo = Math.round(amount * 100);

  const current = await prisma.contributionSubscription.findUnique({ where: { memberId: member.id } });
  if (current?.status === "ACTIVE") {
    errorRedirect("/dashboard/contributions", "You already have an active monthly contribution.");
  }

  let plan = await prisma.contributionPlan.findUnique({ where: { amountKobo } });
  if (!plan) {
    try {
      const created = await createPaystackPlan(amountKobo);
      plan = await prisma.contributionPlan.create({
        data: { amountKobo, paystackPlanCode: created.plan_code },
      });
    } catch (error) {
      errorRedirect("/dashboard/contributions", error instanceof Error ? error.message : "Unable to create contribution plan.");
    }
  }

  const subscription = await prisma.contributionSubscription.upsert({
    where: { memberId: member.id },
    create: { memberId: member.id, planId: plan.id, amount, status: "PENDING" },
    update: {
      planId: plan.id,
      amount,
      status: "PENDING",
      paystackSubscriptionCode: null,
      nextPaymentAt: null,
    },
  });
  const ref = reference("MEM");
  const donation = await prisma.donation.create({
    data: {
      reference: ref,
      type: "MEMBER_CONTRIBUTION",
      amount,
      donorName: member.name,
      donorEmail: member.email,
      donorPhone: member.phone,
      memberId: member.id,
      subscriptionId: subscription.id,
    },
  });

  try {
    const initialized = await initializePaystackTransaction({
      email: member.email,
      reference: ref,
      callbackUrl: `${appUrl()}/api/paystack/callback`,
      planCode: plan.paystackPlanCode,
      metadata: {
        donationId: donation.id,
        donationType: "MEMBER_CONTRIBUTION",
        memberId: member.id,
        subscriptionId: subscription.id,
      },
    });
    redirect(initialized.authorization_url);
  } catch (error) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });
    errorRedirect("/dashboard/contributions", error instanceof Error ? error.message : "Unable to start payment.");
  }
}

async function requireCampaignAdmin() {
  const user = await getCurrentUser();
  if (!user || ![ROLES.ADMIN, ROLES.EXECUTIVE].includes(user.role as typeof ROLES.ADMIN | typeof ROLES.EXECUTIVE)) {
    redirect("/dashboard");
  }
  return user;
}

const campaignSchema = z.object({
  title: z.string().trim().min(3, "Enter a campaign title."),
  description: z.string().trim().min(10, "Enter a longer description."),
  goalAmount: z.coerce.number().positive().optional(),
  suggestedAmount: z.coerce.number().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function createDonationCampaign(formData: FormData) {
  const user = await requireCampaignAdmin();
  const optionalNumber = (name: string) => formData.get(name) || undefined;
  const parsed = campaignSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    goalAmount: optionalNumber("goalAmount"),
    suggestedAmount: optionalNumber("suggestedAmount"),
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });
  if (!parsed.success) redirect(`/dashboard/donations?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check the form.")}`);
  const d = parsed.data;
  const base = slugify(d.title) || "campaign";
  let slug = base;
  let suffix = 2;
  while (await prisma.donationCampaign.findUnique({ where: { slug } })) slug = `${base}-${suffix++}`;

  await prisma.donationCampaign.create({
    data: {
      slug,
      title: d.title,
      description: d.description,
      goalAmount: d.goalAmount,
      suggestedAmount: d.suggestedAmount,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      createdById: user.id,
    },
  });
  await prisma.activityLog.create({ data: { userId: user.id, action: "DONATION_CAMPAIGN_CREATED", detail: d.title } });
  revalidatePath("/dashboard/donations");
  revalidatePath("/donate");
  revalidatePath("/");
}

export async function toggleDonationCampaign(formData: FormData) {
  const user = await requireCampaignAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  const campaign = await prisma.donationCampaign.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({
    data: { userId: user.id, action: active ? "DONATION_CAMPAIGN_OPENED" : "DONATION_CAMPAIGN_CLOSED", detail: campaign.title },
  });
  revalidatePath("/dashboard/donations");
  revalidatePath("/donate");
  revalidatePath("/");
}
