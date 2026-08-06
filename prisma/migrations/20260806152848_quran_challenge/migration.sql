-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "lastLeaderboardEmailMonth" TEXT;

-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "audioStoredName" TEXT NOT NULL,
    "audioMimeType" TEXT NOT NULL,
    "weekOf" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Verse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "audioStoredName" TEXT NOT NULL,
    "audioMimeType" TEXT NOT NULL,
    "audioSize" INTEGER NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recitation_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Verse_weekOf_key" ON "Verse"("weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "Recitation_verseId_memberId_key" ON "Recitation"("verseId", "memberId");
