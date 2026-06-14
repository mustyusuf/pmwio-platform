/*
  Warnings:

  - You are about to drop the column `referredById` on the `Member` table. All the data in the column will be lost.
  - Made the column `refereeId` on table `Application` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refereeId" TEXT NOT NULL,
    "memberId" TEXT,
    CONSTRAINT "Application_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("category", "country", "createdAt", "details", "email", "fullName", "id", "memberId", "phone", "refereeId", "status") SELECT "category", "country", "createdAt", "details", "email", "fullName", "id", "memberId", "phone", "refereeId", "status" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refereeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("country", "createdAt", "email", "id", "name", "passwordHash", "phone", "refereeId", "role") SELECT "country", "createdAt", "email", "id", "name", "passwordHash", "phone", "refereeId", "role" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_refereeId_key" ON "Member"("refereeId");
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
