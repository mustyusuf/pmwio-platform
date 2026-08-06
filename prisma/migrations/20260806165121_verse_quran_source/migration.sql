/*
  Warnings:

  - Added the required column `arabicText` to the `Verse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ayahNumber` to the `Verse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surahNumber` to the `Verse` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Verse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surahNumber" INTEGER NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "arabicText" TEXT NOT NULL,
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
INSERT INTO "new_Verse" ("audioMimeType", "audioStoredName", "createdAt", "createdById", "id", "publishedAt", "reference", "translation", "transliteration", "weekOf") SELECT "audioMimeType", "audioStoredName", "createdAt", "createdById", "id", "publishedAt", "reference", "translation", "transliteration", "weekOf" FROM "Verse";
DROP TABLE "Verse";
ALTER TABLE "new_Verse" RENAME TO "Verse";
CREATE UNIQUE INDEX "Verse_weekOf_key" ON "Verse"("weekOf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
