-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "audioStoredName" TEXT,
    "audioMimeType" TEXT,
    "audioSize" INTEGER NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recitation_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recitation" ("audioMimeType", "audioSize", "audioStoredName", "id", "memberId", "submittedAt", "verseId") SELECT "audioMimeType", "audioSize", "audioStoredName", "id", "memberId", "submittedAt", "verseId" FROM "Recitation";
DROP TABLE "Recitation";
ALTER TABLE "new_Recitation" RENAME TO "Recitation";
CREATE UNIQUE INDEX "Recitation_verseId_memberId_key" ON "Recitation"("verseId", "memberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
