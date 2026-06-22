-- CreateTable
CREATE TABLE "DonationCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalAmount" REAL,
    "suggestedAmount" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DonationCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContributionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountKobo" INTEGER NOT NULL,
    "paystackPlanCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContributionSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paystackSubscriptionCode" TEXT,
    "paystackCustomerCode" TEXT,
    "nextPaymentAt" DATETIME,
    "lastPaymentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContributionSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContributionSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ContributionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "donorName" TEXT,
    "donorEmail" TEXT NOT NULL,
    "donorPhone" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "channel" TEXT,
    "paystackId" TEXT,
    "paidAt" DATETIME,
    "memberId" TEXT,
    "campaignId" TEXT,
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Donation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Donation_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ContributionSubscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationCampaign_slug_key" ON "DonationCampaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionPlan_amountKobo_key" ON "ContributionPlan"("amountKobo");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionPlan_paystackPlanCode_key" ON "ContributionPlan"("paystackPlanCode");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionSubscription_memberId_key" ON "ContributionSubscription"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionSubscription_paystackSubscriptionCode_key" ON "ContributionSubscription"("paystackSubscriptionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_reference_key" ON "Donation"("reference");
