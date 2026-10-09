-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "audience" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "delivered" BOOLEAN NOT NULL,
    "sentById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
