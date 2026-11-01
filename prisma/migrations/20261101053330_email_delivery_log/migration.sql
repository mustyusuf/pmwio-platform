-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "refId" TEXT,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "sent" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "triggeredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailCampaign_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "payload" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EmailCampaign_kind_refId_idx" ON "EmailCampaign"("kind", "refId");

-- CreateIndex
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_campaignId_status_idx" ON "EmailDelivery"("campaignId", "status");
