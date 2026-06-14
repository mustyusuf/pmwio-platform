-- AlterTable
ALTER TABLE "Application" ADD COLUMN "renewedFromId" TEXT;
ALTER TABLE "Application" ADD COLUMN "scholarshipEnd" DATETIME;
ALTER TABLE "Application" ADD COLUMN "scholarshipStart" DATETIME;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "Document" ADD COLUMN "size" INTEGER;
ALTER TABLE "Document" ADD COLUMN "storedName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "imagePath" TEXT;

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
